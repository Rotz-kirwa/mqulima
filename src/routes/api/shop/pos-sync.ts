import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { cleanDescriptionText } from "@/lib/shop-data";
import crypto from "crypto";

const PosProductSchema = z.object({
  pos_id: z.union([z.string(), z.number()]).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  sku: z.string().optional(),
  name: z.string().min(1, "Product name is required"),
  price: z.number().nonnegative("Price must be a positive number"),
  stock_quantity: z.number().int().nonnegative().optional().default(0),
  stockQty: z.number().int().nonnegative().optional(),
  category: z.string().optional().default("Seeds & Seedlings"),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().optional(),
  image_urls: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  brand: z.string().optional(),
  unit: z.string().optional(),
});

const PosSyncPayloadSchema = z.union([
  z.object({
    products: z.array(PosProductSchema),
  }),
  PosProductSchema,
  z.array(PosProductSchema),
]);

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export const Route = createFileRoute("/api/shop/pos-sync")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          // 1. Authorization Token & WooCommerce Key/Secret Validation
          const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
          let queryToken: string | null = null;
          let consumerKey: string | null = null;
          let consumerSecret: string | null = null;
          
          try {
            const url = new URL(request.url, "http://localhost:8080");
            queryToken = url.searchParams.get("token") || url.searchParams.get("apiKey");
            consumerKey = url.searchParams.get("consumer_key");
            consumerSecret = url.searchParams.get("consumer_secret");
          } catch (e) {
            console.error("[POS SYNC] URL Parse error:", e);
          }

          const expectedToken = (process.env.POS_SYNC_TOKEN || "").trim();
          const expectedConsumerKey = (process.env.WOO_CONSUMER_KEY || "").trim();
          const expectedConsumerSecret = (process.env.WOO_CONSUMER_SECRET || "").trim();

          if (!expectedToken && (!expectedConsumerKey || !expectedConsumerSecret)) {
            console.error("[POS SYNC] POS integration credentials are not configured in environment variables.");
            return new Response(
              JSON.stringify({
                success: false,
                error: "POS sync service is not configured on this server.",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          let isAuthorized = false;

          // Check Bearer Token
          if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
            const token = authHeader.substring(7).trim();
            if ((expectedToken && token === expectedToken) || (expectedConsumerKey && token === expectedConsumerKey)) {
              isAuthorized = true;
            }
          }

          // Check WooCommerce Basic Auth Header (Authorization: Basic base64(ck:cs))
          if (!isAuthorized && authHeader && authHeader.toLowerCase().startsWith("basic ")) {
            try {
              const base64Credentials = authHeader.substring(6).trim();
              const decoded = Buffer.from(base64Credentials, "base64").toString("utf-8");
              const [user, pass] = decoded.split(":");
              if (expectedConsumerKey && expectedConsumerSecret && user === expectedConsumerKey && pass === expectedConsumerSecret) {
                isAuthorized = true;
              } else if (expectedToken && user === expectedToken) {
                isAuthorized = true;
              }
            } catch (e) {
              // ignore decode error
            }
          }

          // Check Query Params
          if (!isAuthorized) {
            if (queryToken && ((expectedToken && queryToken.trim() === expectedToken) || (expectedConsumerKey && queryToken.trim() === expectedConsumerKey))) {
              isAuthorized = true;
            } else if (consumerKey && consumerSecret && expectedConsumerKey && expectedConsumerSecret && consumerKey.trim() === expectedConsumerKey && consumerSecret.trim() === expectedConsumerSecret) {
              isAuthorized = true;
            }
          }

          if (!isAuthorized) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Unauthorized POS Access. Invalid or missing authentication credentials.",
              }),
              { status: 401, headers: { "Content-Type": "application/json" } }
            );
          }

          // 2. Parse Payload
          const body = await request.json();
          const parseResult = PosSyncPayloadSchema.safeParse(body);

          if (!parseResult.success) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Invalid request payload format",
                details: parseResult.error.flatten(),
              }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const data = parseResult.data;
          let productList: z.infer<typeof PosProductSchema>[] = [];

          if (Array.isArray(data)) {
            productList = data;
          } else if ("products" in data) {
            productList = data.products;
          } else {
            productList = [data];
          }

          if (productList.length === 0) {
            return new Response(
              JSON.stringify({
                success: true,
                message: "No products provided in sync payload.",
                syncedCount: 0,
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          // 3. Batched Database Sync Execution (1 atomic check + 1 atomic upsert)
          const { getDb } = await import("@/lib/db.server");
          const sql = getDb();

          // Prepare normalized input rows
          const preparedItems = productList.map((item) => {
            const name = item.name.trim();
            const rawSlug = item.sku ? slugify(item.sku) : slugify(name);
            const basePrice = item.price;
            const stockQty = item.stock_quantity ?? item.stockQty ?? 0;
            const status = stockQty > 0 ? "active" : "out_of_stock";
            const description = cleanDescriptionText(item.description || "") || "Certified genuine agricultural input for farm use.";

            let imageUrls: string[] = [];
            if (item.image_urls && item.image_urls.length > 0) imageUrls = item.image_urls.filter((u) => u && !u.includes("default.png"));
            else if (item.images && item.images.length > 0) imageUrls = item.images.filter((u) => u && !u.includes("default.png"));
            else if (item.image_url && !item.image_url.includes("default.png")) imageUrls = [item.image_url];

            if (imageUrls.length === 0) {
              imageUrls = ["https://technolake.net/smooth-sale-pos/public/img/default.png"];
            }

            const categoryName = item.category || "Seeds & Seedlings";
            const rawBrand = item.brand;
            const brand = (rawBrand && !rawBrand.toLowerCase().includes("pos") && !rawBrand.toLowerCase().includes("smooth sale"))
              ? rawBrand
              : (categoryName || "Verified Input");
            const unit = item.unit || "Unit";

            const extId = String(item.pos_id || item.id || item.sku || "").trim();

            return {
              name,
              rawSlug,
              basePrice,
              stockQty,
              status,
              description,
              imageUrls,
              brand,
              unit,
              categoryName,
              externalProductId: extId || null,
            };
          });

          // Fetch all existing products matching any incoming slug or name in a single query
          const rawSlugs = preparedItems.map((p) => p.rawSlug).filter(Boolean);
          const lowerNames = preparedItems.map((p) => p.name.toLowerCase()).filter(Boolean);

          const existingRows = (rawSlugs.length > 0 || lowerNames.length > 0)
            ? await sql`
                SELECT id, slug, LOWER(name) AS lower_name
                FROM products
                WHERE slug = ANY(${rawSlugs}) OR LOWER(name) = ANY(${lowerNames})
              `
            : [];

          const existingBySlug = new Map<string, { id: string; slug: string }>();
          const existingByName = new Map<string, { id: string; slug: string }>();
          for (const row of existingRows as any[]) {
            if (row.slug) existingBySlug.set(row.slug, { id: row.id, slug: row.slug });
            if (row.lower_name) existingByName.set(row.lower_name, { id: row.id, slug: row.slug });
          }

          // Build batch rows with deduplication
          const seenIds = new Set<string>();
          const batchRows: any[] = [];
          const syncedItems: Array<{ id: string; name: string; slug: string; price: number; stock: number }> = [];

          for (const item of preparedItems) {
            const existing = existingBySlug.get(item.rawSlug) || existingByName.get(item.name.toLowerCase());
            let id: string;
            let slug: string;

            if (existing) {
              id = existing.id;
              slug = existing.slug;
            } else {
              id = crypto.randomUUID();
              slug = `${item.rawSlug}-${crypto.randomUUID().slice(0, 6)}`;
            }

            if (seenIds.has(id)) {
              continue;
            }
            seenIds.add(id);

            batchRows.push({
              id,
              name: item.name,
              slug,
              base_price: item.basePrice,
              stock_qty: item.stockQty,
              status: item.status,
              description: item.description,
              image_urls: item.imageUrls,
              brand: item.brand,
              seller: "Certified Agrovet Partner",
              county: "Kenya",
              unit: item.unit,
              shop_type: "Agrovet",
              subcategory: item.categoryName,
              is_featured: false,
              external_product_id: item.externalProductId || id,
              created_at: new Date(),
              updated_at: new Date(),
            });

            syncedItems.push({
              id,
              name: item.name,
              slug,
              price: item.basePrice,
              stock: item.stockQty,
            });
          }

          // Single atomic batch upsert with WHERE IS DISTINCT FROM
          if (batchRows.length > 0) {
            await (sql as any)`
              INSERT INTO products ${(sql as any)(
                batchRows,
                "id",
                "name",
                "slug",
                "base_price",
                "stock_qty",
                "status",
                "description",
                "image_urls",
                "brand",
                "seller",
                "county",
                "unit",
                "shop_type",
                "subcategory",
                "is_featured",
                "external_product_id",
                "created_at",
                "updated_at"
              )}
              ON CONFLICT (id) DO UPDATE SET
                base_price = EXCLUDED.base_price,
                stock_qty = EXCLUDED.stock_qty,
                status = EXCLUDED.status,
                description = EXCLUDED.description,
                image_urls = EXCLUDED.image_urls,
                brand = EXCLUDED.brand,
                unit = EXCLUDED.unit,
                external_product_id = COALESCE(EXCLUDED.external_product_id, products.external_product_id),
                updated_at = NOW()
              WHERE products.base_price IS DISTINCT FROM EXCLUDED.base_price
                 OR products.stock_qty IS DISTINCT FROM EXCLUDED.stock_qty
                 OR products.status IS DISTINCT FROM EXCLUDED.status
                 OR products.description IS DISTINCT FROM EXCLUDED.description
                 OR products.brand IS DISTINCT FROM EXCLUDED.brand
                 OR products.unit IS DISTINCT FROM EXCLUDED.unit
            `;
          }

          const syncedCount = batchRows.length;

          // Invalidate both API and server function caches so changes show immediately
          try {
            const { invalidateApiProductsCache } = await import("@/routes/api/products");
            invalidateApiProductsCache();
          } catch (e) {}
          try {
            const { invalidateProductsCache } = await import("@/lib/api/shop.server");
            invalidateProductsCache();
          } catch (e) {}

          return new Response(
            JSON.stringify({
              success: true,
              message: `Successfully synced ${syncedCount} product(s) from POS to Mqulima shop.`,
              syncedCount,
              syncedItems,
              timestamp: new Date().toISOString(),
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              },
            }
          );
        } catch (err: any) {
          console.error("[POS SYNC ENDPOINT ERROR]:", err);
          return new Response(
            JSON.stringify({
              success: false,
              error: err?.message || "Internal server error occurred while syncing POS products.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
