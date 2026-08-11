import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { adminQuotations } from "@/db/schema/admin";
import { orders } from "@/db/schema/orders";
import { desc, eq } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";

export const Route = createFileRoute("/api/admin/quotations")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          const list = await db
            .select()
            .from(adminQuotations)
            .orderBy(desc(adminQuotations.createdAt))
            .limit(50);

          return new Response(JSON.stringify({ success: true, quotations: list }), {
            headers: { "Content-Type": "application/json" },
          });
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
          const { action, id, actorId = "system-admin" } = body;

          if (action === "convert_to_order") {
            const q = await db.select().from(adminQuotations).where(eq(adminQuotations.id, id));
            if (q.length === 0) {
              return new Response(JSON.stringify({ success: false, error: "Quotation not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
              });
            }

            const targetQ = q[0];
            const newOrderId = `ord-q-${Date.now()}`;

            await db.insert(orders).values({
              id: newOrderId,
              userId: targetQ.customerId,
              total: targetQ.totalAmountKsh.toString(),
              status: "confirmed",
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            await db
              .update(adminQuotations)
              .set({ status: "converted" })
              .where(eq(adminQuotations.id, id));

            await logAdminAction({
              actorId,
              action: "B2B_QUOTATION_CONVERTED",
              entity: "quotations",
              entityId: id,
              diff: { convertedOrderId: newOrderId },
            });

            return new Response(
              JSON.stringify({ success: true, message: "Quotation converted to active Order", orderId: newOrderId }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          return new Response(JSON.stringify({ success: false, error: "Invalid action" }), {
            status: 400,
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
