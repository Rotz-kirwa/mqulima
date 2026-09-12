import { createFileRoute } from "@tanstack/react-router";
import { getDrizzleDb } from "@/lib/db.server";
import { products, productVariants } from "@/db/schema/products";
import { eq } from "drizzle-orm";
import { resolveFastProductImage } from "@/lib/api/shop.server";
import { cleanDescriptionText } from "@/lib/shop-data";

export const Route = createFileRoute("/api/products/$id")({
  server: {
    handlers: {
      GET: async ({ params }: { params: { id: string } }) => {
        try {
          const productId = params.id;
          if (!productId) {
            return new Response(
              JSON.stringify({ success: false, error: "Product ID parameter required" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const db = getDrizzleDb();

          const productMatch = await db
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .limit(1);

          if (productMatch.length === 0) {
            return new Response(
              JSON.stringify({ success: false, error: `Product with ID '${productId}' not found` }),
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
                availability: (p.stockQty || 0) > 0 ? "In Stock" : "Out of Stock",
                status: p.status,
                category: p.subcategory || p.shopType || "General Inputs",
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
        } catch (err: any) {
          console.error("[API /api/products/:id Error]:", err);
          return new Response(
            JSON.stringify({ success: false, error: err?.message || "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
