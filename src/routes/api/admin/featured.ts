import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { featuredItems } from "@/db/schema/admin";
import { products } from "@/db/schema/products";
import { eq, asc } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";
import { invalidateFeaturedCache } from "@/lib/api/products.server";

export const Route = createFileRoute("/api/admin/featured")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          // Single source of truth: query featured_items ordered by position ASC
          // Never auto-seed items if empty — empty collection remains cleanly empty
          const list = await db.select().from(featuredItems).orderBy(asc(featuredItems.position));

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

          // ────────────────────────────────────────────────────────────
          // 1. CREATE ACTION
          // ────────────────────────────────────────────────────────────
          if (action === "create") {
            if (!imageUrl || !imageUrl.trim()) {
              return new Response(
                JSON.stringify({ success: false, error: "Image (URL or Upload) is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }

            const newId = `feat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const cleanImageUrl = imageUrl.trim();
            const cleanTitle = title ? title.trim() : "Farm Essential";
            const cleanLinkUrl = linkUrl ? linkUrl.trim() : "/shop";

            const result = await db.transaction(async (tx) => {
              const existing = await tx.select().from(featuredItems);
              const nextPos = existing.length > 0 ? Math.max(...existing.map((e) => e.position ?? 0)) + 1 : 0;

              let entityType = "image";
              let entityId = newId;

              // If linkUrl points to a product slug, link entity and mark product as isFeatured = true
              if (cleanLinkUrl && cleanLinkUrl.includes("/shop/product/")) {
                const slug = cleanLinkUrl.replace(/^.*\/shop\/product\//, "").replace(/\/$/, "").trim();
                if (slug) {
                  const matchedProd = await tx.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
                  if (matchedProd.length > 0) {
                    entityType = "product";
                    entityId = matchedProd[0].id;
                    await tx.update(products).set({ isFeatured: true }).where(eq(products.id, matchedProd[0].id));
                  }
                }
              }

              const inserted = await tx.insert(featuredItems).values({
                id: newId,
                entityType,
                entityId,
                imageUrl: cleanImageUrl,
                title: cleanTitle,
                linkUrl: cleanLinkUrl,
                position: nextPos,
                createdAt: new Date(),
                updatedAt: new Date(),
              }).returning({ id: featuredItems.id });

              return { inserted, nextPos };
            });

            if (!result.inserted || result.inserted.length === 0) {
              return new Response(
                JSON.stringify({ success: false, error: "Failed to insert featured item" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
              );
            }

            await logAdminAction({
              actorId,
              action: "FEATURED_CREATED",
              entity: "featured_items",
              entityId: newId,
              diff: { imageUrl: cleanImageUrl, title: cleanTitle, linkUrl: cleanLinkUrl, position: result.nextPos },
            });

            invalidateFeaturedCache();
            return new Response(
              JSON.stringify({ success: true, message: "Featured item created successfully", id: newId }),
              { status: 201, headers: { "Content-Type": "application/json" } }
            );
          }

          // ────────────────────────────────────────────────────────────
          // 2. DELETE ACTION (Transactional with RETURNING & 404 validation)
          // ────────────────────────────────────────────────────────────
          if (action === "delete") {
            if (!id || typeof id !== "string" || !id.trim()) {
              return new Response(
                JSON.stringify({ success: false, error: "Item ID is required for deletion" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }

            const cleanId = id.trim();

            const deletedRows = await db.transaction(async (tx) => {
              // 1. Check if item exists
              const existing = await tx.select().from(featuredItems).where(eq(featuredItems.id, cleanId)).limit(1);
              if (existing.length === 0) {
                return [];
              }

              const item = existing[0];
              // 2. Unset isFeatured on linked product if this was a product
              if (item.entityId && item.entityId !== "custom" && !item.entityId.startsWith("feat-")) {
                await tx.update(products).set({ isFeatured: false }).where(eq(products.id, item.entityId));
              } else if (item.linkUrl && item.linkUrl.includes("/shop/product/")) {
                const slug = item.linkUrl.replace(/^.*\/shop\/product\//, "").replace(/\/$/, "").trim();
                if (slug) {
                  await tx.update(products).set({ isFeatured: false }).where(eq(products.slug, slug));
                }
              }

              // 3. Delete from featured_items with returning id
              return await tx.delete(featuredItems).where(eq(featuredItems.id, cleanId)).returning({ id: featuredItems.id });
            });

            if (deletedRows.length === 0) {
              return new Response(
                JSON.stringify({ success: false, error: `Featured item '${cleanId}' not found or already deleted` }),
                { status: 404, headers: { "Content-Type": "application/json" } }
              );
            }

            await logAdminAction({
              actorId,
              action: "FEATURED_DELETED",
              entity: "featured_items",
              entityId: cleanId,
              diff: { deletedId: cleanId },
            });

            invalidateFeaturedCache();
            return new Response(
              JSON.stringify({ success: true, message: "Featured item deleted successfully", deletedId: cleanId }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          // ────────────────────────────────────────────────────────────
          // 3. UPDATE ACTION (Transactional with RETURNING & 404 validation)
          // ────────────────────────────────────────────────────────────
          if (action === "update" || action === "edit") {
            if (!id || typeof id !== "string" || !id.trim()) {
              return new Response(
                JSON.stringify({ success: false, error: "Item ID is required for update" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }

            const cleanId = id.trim();
            const updates: Record<string, any> = { updatedAt: new Date() };
            if (imageUrl !== undefined && imageUrl.trim()) updates.imageUrl = imageUrl.trim();
            if (title !== undefined) updates.title = title.trim();
            if (linkUrl !== undefined) updates.linkUrl = linkUrl.trim();
            if (displayOrder !== undefined) updates.position = Number(displayOrder);

            const updatedRows = await db.transaction(async (tx) => {
              return await tx.update(featuredItems).set(updates).where(eq(featuredItems.id, cleanId)).returning({ id: featuredItems.id });
            });

            if (updatedRows.length === 0) {
              return new Response(
                JSON.stringify({ success: false, error: `Featured item '${cleanId}' not found` }),
                { status: 404, headers: { "Content-Type": "application/json" } }
              );
            }

            await logAdminAction({
              actorId,
              action: "FEATURED_UPDATED",
              entity: "featured_items",
              entityId: cleanId,
              diff: updates,
            });

            invalidateFeaturedCache();
            return new Response(
              JSON.stringify({ success: true, message: "Featured item updated successfully" }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          // ────────────────────────────────────────────────────────────
          // 4. REORDER ACTION (Transactional with RETURNING & 404 validation)
          // ────────────────────────────────────────────────────────────
          if (!id || typeof id !== "string" || !id.trim()) {
            return new Response(
              JSON.stringify({ success: false, error: "Item ID is required for reorder" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const cleanId = id.trim();
          const targetPos = displayOrder !== undefined ? Number(displayOrder) : 0;

          const reorderedRows = await db.transaction(async (tx) => {
            return await tx.update(featuredItems).set({ position: targetPos, updatedAt: new Date() }).where(eq(featuredItems.id, cleanId)).returning({ id: featuredItems.id });
          });

          if (reorderedRows.length === 0) {
            return new Response(
              JSON.stringify({ success: false, error: `Featured item '${cleanId}' not found` }),
              { status: 404, headers: { "Content-Type": "application/json" } }
            );
          }

          await logAdminAction({
            actorId,
            action: "FEATURED_REORDERED",
            entity: "featured_items",
            entityId: cleanId,
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
