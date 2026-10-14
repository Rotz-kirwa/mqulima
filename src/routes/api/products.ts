import { createFileRoute } from "@tanstack/react-router";
import { getDrizzleDb } from "@/lib/db.server";
import { products, productVariants, productCategories } from "@/db/schema/products";
import { eq, desc, sql, inArray, or } from "drizzle-orm";
import { resolveFastProductImage } from "@/lib/api/shop.server";
import { mapToNewTaxonomy, cleanDescriptionText, AGRICULTURE_TAXONOMY } from "@/lib/shop-data";

// PERF: in-memory listing cache with stale-while-revalidate. Do not remove —
// see PERFORMANCE.md. Invalidated by admin product mutations and POS sync.
const LIST_CACHE_TTL_MS = 60_000;
const LIST_CACHE_STALE_MS = 10 * 60_000;
const listCache = new Map<string, { body: string; freshUntil: number; staleUntil: number }>();
const inflight = new Map<string, Promise<string>>();

export function invalidateApiProductsCache() {
  listCache.clear();
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/api/products")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url, "http://localhost:3000");
          const productId = url.searchParams.get("id");
          const slug = url.searchParams.get("slug");
          const category = url.searchParams.get("category");
          const search = url.searchParams.get("search");

          const db = getDrizzleDb();


          // Single Product Details Request via ?id=... or ?slug=...
          if (productId || slug) {
            // Non-UUID ids (e.g. POS external ids / slugs) must not hit the uuid column — Postgres throws.
            const idOrSlugWhere = productId
              ? (UUID_RE.test(productId)
                  ? eq(products.id, productId)
                  : or(eq(products.slug, productId), eq(products.externalProductId, productId)))
              : eq(products.slug, slug!);
            const productMatch = await db
              .select()
              .from(products)
              .where(idOrSlugWhere)
              .limit(1);

            if (productMatch.length === 0) {
              return new Response(
                JSON.stringify({ success: false, error: "Product not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
              );
            }

            const p = productMatch[0];
            const variants = await db
              .select()
              .from(productVariants)
              .where(eq(productVariants.productId, p.id));

            return new Response(
              JSON.stringify({
                success: true,
                product: {
                  id: p.id,
                  externalProductId: p.externalProductId,
                  name: p.name,
                  slug: p.slug,
                  description: cleanDescriptionText(p.description) || "Certified genuine agricultural input for farm use.",
                  basePrice: Number(p.basePrice) || 0,
                  stockQuantity: p.stockQty || 0,
                  status: p.status,
                  category: p.subcategory || p.shopType || "General",
                  subcategory: p.subcategory,
                  brand: (p.brand && !/smooth\s*sale/i.test(p.brand)) ? p.brand : (p.subcategory || "Verified Input"),
                  seller: (p.seller && !/smooth\s*sale/i.test(p.seller)) ? p.seller : "Certified Agrovet Partner",
                  county: p.county || "Kenya",
                  unit: p.unit || "Unit",
                  images: p.imageUrls && p.imageUrls.length > 0 && !p.imageUrls[0].includes("default.png") ? p.imageUrls : [resolveFastProductImage(p)],
                  isFeatured: p.isFeatured || false,
                  avgRating: Number(p.avgRating) || 5.0,
                  ratingCount: p.ratingCount || 0,
                  variations: variants.map((v) => ({
                    id: v.id,
                    externalVariationId: v.externalVariationId,
                    variantLabel: v.variantLabel,
                    sku: v.sku || "N/A",
                    price: Number(v.price) || 0,
                    stockQuantity: v.stockQty || 0,
                    location: v.location || "Main Store Inventory",
                    updatedAt: v.updatedAt,
                  })),
                  createdAt: p.createdAt,
                  updatedAt: p.updatedAt,
                },
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          // Product Listing Request with Pagination
          const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
          // PERF: paginated by default (was 1000). Callers can still request up to 1000 explicitly.
          const limit = Math.min(1000, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10) || 50));
          const offset = (page - 1) * limit;

          const cacheKey = `${page}|${limit}|${category || ""}|${(search || "").trim().toLowerCase()}`;
          const jsonHeaders = {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
          };
          const now = Date.now();
          const hit = listCache.get(cacheKey);

          const build = async (): Promise<string> => {

          const andConditions = [
            sql`${products.deletedAt} IS NULL`,
            eq(products.status, "active"),
          ];

          if (category && category !== "All") {
            const catLower = category.trim().toLowerCase();
            const matchingSubs: string[] = [catLower];

            for (const [parentCat, subcats] of Object.entries(AGRICULTURE_TAXONOMY)) {
              if (parentCat.toLowerCase() === catLower) {
                if (Array.isArray(subcats)) {
                  matchingSubs.push(...subcats.map((s) => s.toLowerCase()));
                } else if (typeof subcats === "object" && subcats !== null) {
                  for (const [subGroup, leafList] of Object.entries(subcats)) {
                    matchingSubs.push(subGroup.toLowerCase());
                    if (Array.isArray(leafList)) {
                      matchingSubs.push(...leafList.map((l) => l.toLowerCase()));
                    }
                  }
                }
              }
            }

            const uniqueSubs = Array.from(new Set(matchingSubs));
            const subConds = uniqueSubs.map((s) => sql`LOWER(${products.subcategory}) = ${s}`);
            const fieldConds = uniqueSubs.map((s) => sql`LOWER(${products.field}) = ${s}`);
            const allCatConds = [
              ...subConds,
              ...fieldConds,
              sql`LOWER(${products.shopType}) = ${catLower}`,
              sql`LOWER(${products.field}) LIKE ${'%' + catLower + '%'}`,
            ];
            if (catLower.includes("seed")) {
              allCatConds.push(
                sql`(LOWER(${products.name}) LIKE '%seed%' OR LOWER(${products.name}) LIKE '%spinach%' OR LOWER(${products.name}) LIKE '%cabbage%' OR LOWER(${products.name}) LIKE '%tomato%' OR LOWER(${products.name}) LIKE '%onion%' OR LOWER(${products.name}) LIKE '%maize%')`
              );
            } else if (catLower.includes("protect") || catLower.includes("chem")) {
              allCatConds.push(
                sql`(LOWER(${products.name}) LIKE '%cide%' OR LOWER(${products.name}) LIKE '%weedal%' OR LOWER(${products.name}) LIKE '%zetanil%' OR LOWER(${products.name}) LIKE '%macarena%' OR LOWER(${products.name}) LIKE '%aquawet%')`
              );
            } else if (catLower.includes("animal")) {
              allCatConds.push(
                sql`(LOWER(${products.name}) LIKE '%feed%' OR LOWER(${products.name}) LIKE '%mash%' OR LOWER(${products.name}) LIKE '%lick%' OR LOWER(${products.name}) LIKE '%salve%' OR LOWER(${products.name}) LIKE '%kupe%' OR LOWER(${products.name}) LIKE '%nilzan%')`
              );
            } else if (catLower.includes("equip") || catLower.includes("tool")) {
              allCatConds.push(
                sql`(LOWER(${products.name}) LIKE '%sprayer%' OR LOWER(${products.name}) LIKE '%knapsack%' OR LOWER(${products.name}) LIKE '%panga%' OR LOWER(${products.name}) LIKE '%pipe%' OR LOWER(${products.name}) LIKE '%nozzle%')`
              );
            }

            andConditions.push(sql`(${sql.join(allCatConds, sql` OR `)})`);
          }

          if (search && search.trim()) {
            const searchTerm = `%${search.trim().toLowerCase()}%`;
            andConditions.push(
              sql`(LOWER(${products.name}) LIKE ${searchTerm} OR LOWER(${products.description}) LIKE ${searchTerm} OR LOWER(${products.brand}) LIKE ${searchTerm})`
            );
          }

          const combinedWhere = sql.join(andConditions, sql` AND `);

          const [productList, countResult] = await Promise.all([
            db
              .select()
              .from(products)
              .where(combinedWhere)
              .orderBy(desc(products.isFeatured), desc(products.updatedAt))
              .limit(limit)
              .offset(offset),
            db
              .select({ count: sql<number>`count(*)::int` })
              .from(products)
              .where(combinedWhere),
          ]);

          const total = countResult[0]?.count || 0;
          const totalPages = Math.ceil(total / limit) || 1;

          // PERF: single batched variant query instead of one query per product (N+1).
          const productIds = productList.map((p) => p.id);
          const allVariants = productIds.length > 0
            ? await db.select().from(productVariants).where(inArray(productVariants.productId, productIds))
            : [];
          const variantsByProduct = new Map<string, typeof allVariants>();
          for (const v of allVariants) {
            const list = variantsByProduct.get(v.productId as string) || [];
            list.push(v);
            variantsByProduct.set(v.productId as string, list);
          }

          const formattedProducts = productList.map((p) => {
              const vars = variantsByProduct.get(p.id) || [];

              const tax = mapToNewTaxonomy(p);
              const cleanDesc = cleanDescriptionText(p.description) || "Certified genuine agricultural input for farm use.";
              const cleanUnit = (p.unit && !p.unit.includes("[object")) ? p.unit : "Piece";
              const realStock = Math.max(0, Number(p.stockQty ?? 0));
              return {
                id: p.id,
                externalProductId: p.externalProductId,
                name: p.name,
                slug: p.slug,
                description: cleanDesc,
                briefDescription: cleanDesc,
                price: Number(p.basePrice) || 0,
                basePrice: Number(p.basePrice) || 0,
                stock: realStock,
                stockQuantity: realStock,
                availability: realStock > 0 ? "In Stock" : "Out of Stock",
                status: p.status,
                category: tax.category,
                subcategory: tax.subcategory,
                brand: (p.brand && !/smooth\s*sale/i.test(p.brand)) ? p.brand : (tax.subcategory || "Verified Input"),
                seller: (p.seller && !/smooth\s*sale/i.test(p.seller)) ? p.seller : "Certified Agrovet Partner",
                county: p.county || "Kenya",
                verifiedSeller: true,
                unit: cleanUnit,
                image: resolveFastProductImage(p),
                imageUrl: resolveFastProductImage(p),
                images: p.imageUrls || [],
                isFeatured: p.isFeatured || false,
                rating: Number(p.avgRating) || 5.0,
                variationsCount: vars.length,
                variations: vars.map((v) => ({
                  id: v.id,
                  externalVariationId: v.externalVariationId,
                  variantLabel: v.variantLabel,
                  sku: v.sku || "N/A",
                  price: Number(v.price) || 0,
                  stockQuantity: v.stockQty || 0,
                  location: v.location || "Main Store Inventory",
                })),
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
              };
            });

          return JSON.stringify({
            success: true,
            total,
            page,
            totalPages,
            limit,
            products: formattedProducts,
          });
          };

          const refresh = () => {
            let p = inflight.get(cacheKey);
            if (!p) {
              p = build()
                .then((body) => {
                  const t = Date.now();
                  listCache.set(cacheKey, { body, freshUntil: t + LIST_CACHE_TTL_MS, staleUntil: t + LIST_CACHE_STALE_MS });
                  return body;
                })
                .finally(() => inflight.delete(cacheKey));
              inflight.set(cacheKey, p);
            }
            return p;
          };

          let body: string;
          if (hit && hit.freshUntil > now) {
            body = hit.body;
          } else if (hit && hit.staleUntil > now) {
            body = hit.body;
            refresh().catch(() => {});
          } else {
            body = await refresh();
          }

          return new Response(body, { status: 200, headers: jsonHeaders });
        } catch (err: any) {
          console.error("[API /api/products Error]:", err);
          return new Response(
            JSON.stringify({ success: false, error: err?.message || "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
