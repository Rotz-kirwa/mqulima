import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { products } from "@/db/schema/products";
import { featuredItems } from "@/db/schema/admin";
import { eq, desc, ilike, and, or } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth, hasPermission } from "@/lib/api/admin-auth.server";
import { resolveFastProductImage } from "@/lib/api/shop.server";
import { cleanDescriptionText, mapToNewTaxonomy } from "@/lib/shop-data";
import { invalidateProductsCache } from "@/lib/api/shop.server";
import { invalidateApiProductsCache } from "@/routes/api/products";
import { invalidateFeaturedCache } from "@/lib/api/products.server";
import { invalidateAnalyticsCache } from "./analytics";
import crypto from "crypto";

function flushProductCaches() {
  try { invalidateProductsCache(); } catch (e) {}
  try { invalidateApiProductsCache(); } catch (e) {}
  try { invalidateFeaturedCache(); } catch (e) {}
  try { invalidateAnalyticsCache(); } catch (e) {}
}

export const Route = createFileRoute("/api/admin/products")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request, "products.read");
        if ("response" in auth) return auth.response;
        try {
          const url = new URL(request.url);
          const limitParam = url.searchParams.get("limit");
          const pageParam = url.searchParams.get("page");
          const searchParam = url.searchParams.get("search")?.trim();
          const categoryParam = url.searchParams.get("category")?.trim();
          const statusParam = url.searchParams.get("status")?.trim();
          const minimal = url.searchParams.get("minimal") === "true";

          const limit = limitParam ? Math.min(100, Math.max(1, Number(limitParam) || 25)) : 25;
          const page = Math.max(1, Number(pageParam) || 1);
          const offset = (page - 1) * limit;

          const conditions: any[] = [];
          if (searchParam) {
            conditions.push(
              or(
                ilike(products.name, `%${searchParam}%`),
                ilike(products.slug, `%${searchParam}%`),
                ilike(products.brand, `%${searchParam}%`)
              )
            );
          }
          if (statusParam && statusParam !== "all") {
            conditions.push(eq(products.status, statusParam as any));
          }
          if (categoryParam && categoryParam !== "All") {
            conditions.push(
              or(
                eq(products.subcategory, categoryParam),
                eq(products.shopType, categoryParam)
              )
            );
          }

          const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

          // Select only necessary columns
          const query = db
            .select({
              id: products.id,
              name: products.name,
              slug: products.slug,
              basePrice: products.basePrice,
              unit: products.unit,
              subcategory: products.subcategory,
              shopType: products.shopType,
              brand: products.brand,
              imageUrls: products.imageUrls,
              isFeatured: products.isFeatured,
              status: products.status,
              description: products.description,
              deletedAt: products.deletedAt,
              createdAt: products.createdAt,
            })
            .from(products);

          const productList = whereClause
            ? await query.where(whereClause).orderBy(desc(products.createdAt)).limit(limit).offset(offset)
            : await query.orderBy(desc(products.createdAt)).limit(limit).offset(offset);

          return new Response(
            JSON.stringify({
              success: true,
              total: productList.length,
              page,
              limit,
              products: productList.map((p) => {
                const img = (p.imageUrls && p.imageUrls[0] && !p.imageUrls[0].includes("default.png"))
                  ? p.imageUrls[0]
                  : resolveFastProductImage(p as any);
                const tax = mapToNewTaxonomy(p as any);
                const cleanUnit = (p.unit && !p.unit.includes("[object")) ? p.unit : "Piece";
                return {
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  price: Number(p.basePrice) || 0,
                  unit: cleanUnit,
                  category: tax.category || p.subcategory || p.shopType || "Inputs & Agrochemicals",
                  subcategory: tax.subcategory || p.subcategory || "",
                  ...(minimal ? {} : { description: cleanDescriptionText(p.description) || "Certified genuine agricultural input for farm use." }),
                  imageUrl: img,
                  isFeatured: p.isFeatured || false,
                  status: p.status === "draft" ? "draft" : p.status === "archived" ? "archived" : "published",
                  deletedAt: p.deletedAt,
                  createdAt: p.createdAt,
                };
              }),
            }),
            { 
              headers: { 
                "Content-Type": "application/json",
                "Cache-Control": "no-store, no-cache, must-revalidate",
              } 
            }
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

            flushProductCaches();
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

            flushProductCaches();
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

            flushProductCaches();
            return new Response(
              JSON.stringify({ success: true, message: `Product status set to ${newDbStatus}` }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          if (action === "toggle_featured") {
            if (!hasPermission(auth.user.role, "products.update")) {
              return new Response(JSON.stringify({ success: false, error: `Forbidden: role '${auth.user.role}' cannot update products.` }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
              });
            }

            if (!id) {
              return new Response(JSON.stringify({ success: false, error: "Product ID required" }), { status: 400 });
            }

            const current = await db
              .select({
                id: products.id,
                name: products.name,
                slug: products.slug,
                imageUrls: products.imageUrls,
                isFeatured: products.isFeatured,
              })
              .from(products)
              .where(eq(products.id, id))
              .limit(1);

            const newFeatured = current.length > 0 ? !current[0].isFeatured : true;

            await db
              .update(products)
              .set({ isFeatured: newFeatured, updatedAt: new Date() })
              .where(eq(products.id, id));

            if (current.length > 0) {
              const prod = current[0];
              if (newFeatured) {
                // Ensure synced to featured_items
                const existingFeat = await db
                  .select()
                  .from(featuredItems)
                  .where(or(eq(featuredItems.entityId, id), eq(featuredItems.linkUrl, `/shop/product/${prod.slug}`)))
                  .limit(1);

                if (existingFeat.length === 0) {
                  const allFeat = await db.select().from(featuredItems);
                  const nextPos = allFeat.length > 0 ? Math.max(...allFeat.map((e) => e.position ?? 0)) + 1 : 0;
                  const newFeatId = `feat-prod-${prod.id}`;
                  const prodImg = resolveFastProductImage(prod as any);
                  await db.insert(featuredItems).values({
                    id: newFeatId,
                    entityType: "product",
                    entityId: prod.id,
                    imageUrl: prodImg,
                    title: prod.name,
                    linkUrl: `/shop/product/${prod.slug}`,
                    position: nextPos,
                  });
                }
              } else {
                // Remove from featured_items
                await db
                  .delete(featuredItems)
                  .where(or(eq(featuredItems.entityId, id), eq(featuredItems.linkUrl, `/shop/product/${prod.slug}`)));
              }
            }

            await logAdminAction({
              actorId,
              action: "PRODUCT_FEATURED_TOGGLED",
              entity: "products",
              entityId: id,
              diff: { isFeatured: newFeatured },
            });

            flushProductCaches();
            return new Response(
              JSON.stringify({ success: true, message: `Product ${newFeatured ? "marked as featured" : "unfeatured"}`, isFeatured: newFeatured }),
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

            // Remove from featured_items if it was featured
            await db.delete(featuredItems).where(eq(featuredItems.entityId, id));

            await logAdminAction({
              actorId: (auth as any).user?.id || actorId,
              action: "PRODUCT_ARCHIVED",
              entity: "products",
              entityId: id,
              diff: { status: "archived", deletedAt: new Date().toISOString() },
            });

            flushProductCaches();
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
