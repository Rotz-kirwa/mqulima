import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { featuredItems } from "@/db/schema/admin";
import { products } from "@/db/schema/products";
import { eq, asc, desc, and, isNull } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";
import { invalidateFeaturedCache } from "@/lib/api/products.server";
import { resolveFastProductImage } from "@/lib/api/shop.server";

export const Route = createFileRoute("/api/admin/featured")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          let list = await db.select().from(featuredItems).orderBy(asc(featuredItems.position));

          // If featured_items is empty, auto-seed with top active products so admin and main site are always aligned
          if (list.length === 0) {
            const activeProds = await db
              .select()
              .from(products)
              .where(and(eq(products.status, "active"), isNull(products.deletedAt)))
              .orderBy(desc(products.isFeatured), desc(products.createdAt))
              .limit(8);

            for (let i = 0; i < activeProds.length; i++) {
              const p = activeProds[i];
              const newId = `feat-prod-${p.id}`;
              const img = resolveFastProductImage(p);
              await db.insert(featuredItems).values({
                id: newId,
                entityType: "product",
                entityId: p.id,
                imageUrl: img,
                title: p.name,
                linkUrl: `/shop/product/${p.slug}`,
                position: i,
              });
              await db.update(products).set({ isFeatured: true }).where(eq(products.id, p.id));
            }
            invalidateFeaturedCache();
            list = await db.select().from(featuredItems).orderBy(asc(featuredItems.position));
          }

          return new Response(
            JSON.stringify({
              success: true,
              featuredItems: list.map((item) => ({
                id: item.id,
                imageUrl: item.imageUrl || "/placeholder-product.png",
                title: item.title || "Farm Essential",
                linkUrl: item.linkUrl || "/shop",
                entityType: item.entityType,
                displayOrder: item.position,
              })),
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                Pragma: "no-cache",
              },
            }
          );
        } catch (error: any) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          });
        }
      },
      POST: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          const body = await request.json();
          const { action, id, imageUrl, title, linkUrl, displayOrder, actorId = "system-admin" } = body;

          if (action === "create") {
            if (!imageUrl || !imageUrl.trim()) {
              return new Response(
                JSON.stringify({ success: false, error: "Image (URL or Upload) is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }

            const existing = await db.select().from(featuredItems);
            const nextPos = existing.length > 0 ? Math.max(...existing.map((e) => e.position ?? 0)) + 1 : 0;
            const newId = `feat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

            // Check if linkUrl points to a product slug to link entity and mark featured
            let entityType = "image";
            let entityId = newId;
            if (linkUrl && linkUrl.includes("/shop/product/")) {
              const slug = linkUrl.replace(/^.*\/shop\/product\//, "").replace(/\/$/, "").trim();
              if (slug) {
                const matchedProd = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
                if (matchedProd.length > 0) {
                  entityType = "product";
                  entityId = matchedProd[0].id;
                  await db.update(products).set({ isFeatured: true }).where(eq(products.id, matchedProd[0].id));
                }
              }
            }

            await db.insert(featuredItems).values({
              id: newId,
              entityType,
              entityId,
              imageUrl: imageUrl.trim(),
              title: title ? title.trim() : "Farm Essential",
              linkUrl: linkUrl ? linkUrl.trim() : "/shop",
              position: nextPos,
            });

            await logAdminAction({
              actorId,
              action: "FEATURED_CREATED",
              entity: "featured_items",
              entityId: newId,
              diff: { imageUrl, title, linkUrl, position: nextPos },
            });

            invalidateFeaturedCache();
            return new Response(
              JSON.stringify({ success: true, message: "Featured item created successfully", id: newId }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          if (action === "delete") {
            if (!id) {
              return new Response(
                JSON.stringify({ success: false, error: "Item ID is required for deletion" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }

            // Sync with products table if this was a product
            const existing = await db.select().from(featuredItems).where(eq(featuredItems.id, id)).limit(1);
            if (existing.length > 0) {
              const item = existing[0];
              if (item.entityId && item.entityId !== "custom" && !item.entityId.startsWith("feat-")) {
                await db.update(products).set({ isFeatured: false }).where(eq(products.id, item.entityId));
              } else if (item.linkUrl && item.linkUrl.includes("/shop/product/")) {
                const slug = item.linkUrl.replace(/^.*\/shop\/product\//, "").replace(/\/$/, "").trim();
                if (slug) {
                  await db.update(products).set({ isFeatured: false }).where(eq(products.slug, slug));
                }
              }
            }

            await db.delete(featuredItems).where(eq(featuredItems.id, id));

            await logAdminAction({
              actorId,
              action: "FEATURED_DELETED",
              entity: "featured_items",
              entityId: id,
              diff: { deletedId: id },
            });

            invalidateFeaturedCache();
            return new Response(
              JSON.stringify({ success: true, message: "Featured item deleted successfully" }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          if (action === "update" || action === "edit") {
            if (!id) {
              return new Response(
                JSON.stringify({ success: false, error: "Item ID is required for update" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }

            const updates: any = {};
            if (imageUrl !== undefined && imageUrl.trim()) updates.imageUrl = imageUrl.trim();
            if (title !== undefined) updates.title = title.trim();
            if (linkUrl !== undefined) updates.linkUrl = linkUrl.trim();
            if (displayOrder !== undefined) updates.position = Number(displayOrder);

            await db.update(featuredItems).set(updates).where(eq(featuredItems.id, id));

            await logAdminAction({
              actorId,
              action: "FEATURED_UPDATED",
              entity: "featured_items",
              entityId: id,
              diff: updates,
            });

            invalidateFeaturedCache();
            return new Response(
              JSON.stringify({ success: true, message: "Featured item updated successfully" }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          // Default fallback: Reorder action
          const targetPos = displayOrder !== undefined ? Number(displayOrder) : 0;
          await db.update(featuredItems).set({ position: targetPos }).where(eq(featuredItems.id, id));

          await logAdminAction({
            actorId,
            action: "FEATURED_REORDERED",
            entity: "featured_items",
            entityId: id,
            diff: { position: targetPos },
          });

          invalidateFeaturedCache();
          return new Response(JSON.stringify({ success: true, message: "Featured order updated" }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
