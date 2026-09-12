import { createFileRoute } from "@tanstack/react-router";
import { getDrizzleDb } from "@/lib/db.server";
import { products, productVariants, productCategories } from "@/db/schema/products";
import { eq, desc, sql } from "drizzle-orm";
import { resolveFastProductImage } from "@/lib/api/shop.server";
import { mapToNewTaxonomy, cleanDescriptionText } from "@/lib/shop-data";

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
            const productMatch = await db
              .select()
              .from(products)
              .where(
                productId
                  ? eq(products.id, productId)
                  : eq(products.slug, slug!)
              )
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
          const limit = Math.min(1000, Math.max(1, parseInt(url.searchParams.get("limit") || "1000", 10) || 1000));
          const offset = (page - 1) * limit;

          const andConditions = [
            sql`${products.deletedAt} IS NULL`,
            eq(products.status, "active"),
          ];

          if (category && category !== "All") {
            andConditions.push(
              sql`(LOWER(${products.subcategory}) = LOWER(${category}) OR LOWER(${products.shopType}) = LOWER(${category}))`
            );
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

          // Optionally load variation counts or min/max prices
          const formattedProducts = await Promise.all(
            productList.map(async (p) => {
              const vars = await db
                .select()
                .from(productVariants)
                .where(eq(productVariants.productId, p.id));

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
            })
          );

          return new Response(
            JSON.stringify({
              success: true,
              total,
              page,
              totalPages,
              limit,
              products: formattedProducts,
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=60, s-maxage=300",
              },
            }
          );
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
