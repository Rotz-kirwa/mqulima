import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { featuredItems } from "@/db/schema/admin";
import { products } from "@/db/schema/products";
import { eq } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";

export const Route = createFileRoute("/api/admin/featured")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          let list = await db.select().from(featuredItems).orderBy(featuredItems.position);

          if (list.length === 0) {
            const prodList = await db.select().from(products).limit(5);

            for (let i = 0; i < prodList.length; i++) {
              const p = prodList[i];
              await db.insert(featuredItems).values({
                id: `feat-${p.id}`,
                entityType: "product",
                entityId: p.id,
                position: i,
                activeFrom: p.createdAt || new Date(),
                activeTo: null,
              });
            }

            list = await db.select().from(featuredItems).orderBy(featuredItems.position);
          }

          return new Response(
            JSON.stringify({
              success: true,
              featuredItems: list.map((item) => ({
                id: item.id,
                title: `Featured Item ${item.entityId.slice(0, 8)}`,
                entityType: item.entityType,
                displayOrder: item.position,
                subtitle: `Product ID: ${item.entityId}`,
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
          const { id, displayOrder, action, actorId = "system-admin" } = body;

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
