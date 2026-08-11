import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { products } from "@/db/schema/products";
import { eq, desc } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";
import crypto from "crypto";

export const Route = createFileRoute("/api/admin/products")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          const productList = await db
            .select()
            .from(products)
            .orderBy(desc(products.createdAt))
            .limit(200);

          return new Response(
            JSON.stringify({
              success: true,
              products: productList.map((p) => ({
                id: p.id,
                name: p.name,
                price: Number(p.basePrice) || 0,
                unit: p.unit || "50kg bag",
                category: p.subcategory || p.shopType || "Inputs & Agrochemicals",
                description: p.description || "High quality agricultural input for maximum yield.",
                imageUrl: (p.imageUrls && p.imageUrls[0]) || "",
                isFeatured: p.isFeatured || false,
                rating: Number(p.avgRating) || 5.0,
                status: p.status === "draft" ? "draft" : "published",
                createdAt: p.createdAt,
              })),
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (error: any) {
          console.error("Fetch products error:", error);
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      POST: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          const body = await request.json();
          const { 
            action, 
            id, 
            name, 
            price, 
            unit = "Unit", 
            category = "Inputs & Agrochemicals", 
            description = "", 
            imageUrl = "", 
            isFeatured = false, 
            rating = 5,
            status = "published",
            actorId = "system-admin" 
          } = body;

          const dbStatus = (status === "draft") ? "draft" : "active";
          const ratingNum = Math.min(5, Math.max(1, Number(rating) || 5));

          if (action === "create_product") {
            const prodId = crypto.randomUUID();
            const slug = (name || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.floor(Math.random() * 1000);
            
            await db.insert(products).values({
              id: prodId,
              name,
              slug,
              basePrice: (price || 0).toString(),
              unit,
              subcategory: category,
              shopType: category,
              description,
              imageUrls: imageUrl ? [imageUrl] : [],
              isFeatured: !!isFeatured,
              avgRating: ratingNum.toFixed(1),
              ratingCount: 14,
              status: dbStatus,
              stockQty: 999,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            await logAdminAction({
              actorId,
              action: "PRODUCT_CREATED",
              entity: "products",
              entityId: prodId,
              diff: { name, price, category, unit, isFeatured, rating: ratingNum, status: dbStatus },
            });

            return new Response(
              JSON.stringify({ success: true, message: "Product created successfully and published to shop", id: prodId }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          if (action === "update_product") {
            if (!id) {
              return new Response(JSON.stringify({ success: false, error: "Product ID required" }), { status: 400 });
            }

            await db
              .update(products)
              .set({
                name,
                basePrice: (price || 0).toString(),
                unit,
                subcategory: category,
                shopType: category,
                description,
                imageUrls: imageUrl ? [imageUrl] : [],
                isFeatured: !!isFeatured,
                avgRating: ratingNum.toFixed(1),
                status: dbStatus,
                updatedAt: new Date(),
              })
              .where(eq(products.id, id));

            await logAdminAction({
              actorId,
              action: "PRODUCT_UPDATED",
              entity: "products",
              entityId: id,
              diff: { name, price, category, unit, isFeatured, rating: ratingNum, status: dbStatus },
            });

            return new Response(
              JSON.stringify({ success: true, message: "Product updated successfully" }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          if (action === "toggle_status") {
            if (!id) {
              return new Response(JSON.stringify({ success: false, error: "Product ID required" }), { status: 400 });
            }

            const newDbStatus = (status === "published" || status === "active") ? "draft" : "active";
            await db
              .update(products)
              .set({ status: newDbStatus, updatedAt: new Date() })
              .where(eq(products.id, id));

            await logAdminAction({
              actorId,
              action: "PRODUCT_STATUS_TOGGLED",
              entity: "products",
              entityId: id,
              diff: { status: newDbStatus },
            });

            return new Response(
              JSON.stringify({ success: true, message: `Product status set to ${newDbStatus}` }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          if (action === "delete_product") {
            if (!id) {
              return new Response(JSON.stringify({ success: false, error: "Product ID required" }), { status: 400 });
            }

            await db.delete(products).where(eq(products.id, id));

            await logAdminAction({
              actorId,
              action: "PRODUCT_DELETED",
              entity: "products",
              entityId: id,
            });

            return new Response(
              JSON.stringify({ success: true, message: "Product deleted from shop catalog" }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          return new Response(JSON.stringify({ success: false, error: "Invalid action" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error("Manage product error:", error);
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
