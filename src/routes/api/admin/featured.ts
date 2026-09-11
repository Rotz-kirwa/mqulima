import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { featuredItems } from "@/db/schema/admin";
import { eq, asc } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";

const DEFAULT_FEATURED_SEEDS = [
  {
    id: "feat-seed-1",
    imageUrl: "/placeholder-product.png",
    title: "Organic Maize Seed Vector",
    linkUrl: "/shop",
    position: 0,
  },
  {
    id: "feat-seed-2",
    imageUrl: "/placeholder-product.png",
    title: "Solar Water Pump Kit",
    linkUrl: "/shop",
    position: 1,
  },
  {
    id: "feat-seed-3",
    imageUrl: "/placeholder-product.png",
    title: "NPK Premium Booster Fertilizer",
    linkUrl: "/shop",
    position: 2,
  },
  {
    id: "feat-seed-4",
    imageUrl: "/placeholder-product.png",
    title: "Smart Irrigation Drip Lines",
    linkUrl: "/shop",
    position: 3,
  },
  {
    id: "feat-seed-5",
    imageUrl: "/placeholder-product.png",
    title: "High-Yield Tomato Seedling",
    linkUrl: "/shop",
    position: 4,
  },
  {
    id: "feat-seed-6",
    imageUrl: "/placeholder-product.png",
    title: "Veterinary Feed Supplement",
    linkUrl: "/shop",
    position: 5,
  },
];


export const Route = createFileRoute("/api/admin/featured")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          let list = await db.select().from(featuredItems).orderBy(asc(featuredItems.position));

          if (list.length === 0) {
            for (const item of DEFAULT_FEATURED_SEEDS) {
              await db.insert(featuredItems).values({
                id: item.id,
                entityType: "image",
                entityId: item.id,
                imageUrl: item.imageUrl,
                title: item.title,
                linkUrl: item.linkUrl,
                position: item.position,
              });
            }
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
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (error: any) {
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

            await db.insert(featuredItems).values({
              id: newId,
              entityType: "image",
              entityId: newId,
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

            await db.delete(featuredItems).where(eq(featuredItems.id, id));

            await logAdminAction({
              actorId,
              action: "FEATURED_DELETED",
              entity: "featured_items",
              entityId: id,
              diff: { deletedId: id },
            });

            return new Response(
              JSON.stringify({ success: true, message: "Featured item deleted successfully" }),
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
