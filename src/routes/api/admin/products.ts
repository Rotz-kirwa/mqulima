import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { products } from "@/db/schema/products";
import { eq, desc } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth, hasPermission } from "@/lib/api/admin-auth.server";
import { resolveFastProductImage } from "@/lib/api/shop.server";
import { cleanDescriptionText, mapToNewTaxonomy } from "@/lib/shop-data";
import crypto from "crypto";

export const Route = createFileRoute("/api/admin/products")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request, "products.read");
        if ("response" in auth) return auth.response;
        try {
          const url = new URL(request.url);
          const limitParam = url.searchParams.get("limit");
          const limit = limitParam ? Math.min(2000, Math.max(1, Number(limitParam) || 1000)) : 1000;

          const productList = await db
            .select()
            .from(products)
            .orderBy(desc(products.createdAt))
            .limit(limit);

          return new Response(
            JSON.stringify({
              success: true,
              total: productList.length,
              products: productList.map((p) => {
                const img = (p.imageUrls && p.imageUrls[0] && !p.imageUrls[0].includes("default.png"))
                  ? p.imageUrls[0]
                  : resolveFastProductImage(p);
                const tax = mapToNewTaxonomy(p);
                const cleanUnit = (p.unit && !p.unit.includes("[object")) ? p.unit : "Piece";
                return {
                  id: p.id,
                  name: p.name,
                  price: Number(p.basePrice) || 0,
                  unit: cleanUnit,
                  category: tax.category || p.subcategory || p.shopType || "Inputs & Agrochemicals",
                  subcategory: tax.subcategory || p.subcategory || "",
                  description: cleanDescriptionText(p.description) || "Certified genuine agricultural input for farm use.",
                  imageUrl: img,
                  isFeatured: p.isFeatured || false,
                  status: p.status === "draft" ? "draft" : p.status === "archived" ? "archived" : "published",
                  deletedAt: p.deletedAt,
                  createdAt: p.createdAt,
                };
              }),
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
            if (!hasPermission(auth.user.role, "products.create")) {
              return new Response(JSON.stringify({ success: false, error: `Forbidden: role '${auth.user.role}' cannot create products.` }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
              });
            }

            const prodId = crypto.randomUUID();
            const slug = (name || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.floor(Math.random() * 1000);
            
            await db.insert(products).values({
              id: prodId,
              name,
              slug,
              description,
              basePrice: (price || 0).toString(),
              unit,
              subcategory: category,
              shopType: category,
              imageUrls: imageUrl ? [imageUrl] : [],
              isFeatured: !!isFeatured,
              avgRating: ratingNum.toFixed(1),
              status: dbStatus,
              stockQty: 100,
            });

            await logAdminAction({
              actorId,
              action: "PRODUCT_CREATED",
              entity: "products",
              entityId: prodId,
              diff: { name, price, category, unit, isFeatured, rating: ratingNum, status: dbStatus },
            });

            return new Response(
              JSON.stringify({ success: true, message: "Product created successfully", productId: prodId }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          if (action === "update_product") {
            if (!hasPermission(auth.user.role, "products.update")) {
              return new Response(JSON.stringify({ success: false, error: `Forbidden: role '${auth.user.role}' cannot update products.` }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
              });
            }

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
            if (!hasPermission(auth.user.role, "products.update")) {
              return new Response(JSON.stringify({ success: false, error: `Forbidden: role '${auth.user.role}' cannot update product status.` }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
              });
            }

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
            if (!hasPermission(auth.user.role, "products.archive")) {
              return new Response(JSON.stringify({ success: false, error: `Forbidden: role '${auth.user.role}' cannot archive products.` }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (!id) {
              return new Response(JSON.stringify({ success: false, error: "Product ID required" }), { status: 400 });
            }

            const updated = await db
              .update(products)
              .set({
                status: "archived",
                deletedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(products.id, id))
              .returning({ id: products.id });

            if (updated.length === 0) {
              return new Response(JSON.stringify({ success: false, error: "Product not found" }), { status: 404 });
            }

            await logAdminAction({
              actorId: (auth as any).user?.id || actorId,
              action: "PRODUCT_ARCHIVED",
              entity: "products",
              entityId: id,
              diff: { status: "archived", deletedAt: new Date().toISOString() },
            });

            return new Response(
              JSON.stringify({ success: true, message: "Product safely archived from shop catalog" }),
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
