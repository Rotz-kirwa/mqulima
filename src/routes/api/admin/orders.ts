import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { orders } from "@/db/schema/orders";
import { profiles } from "@/db/schema/profiles";
import { eq, desc } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";

export const Route = createFileRoute("/api/admin/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          const rawOrders = await db
            .select({
              id: orders.id,
              userId: orders.userId,
              items: orders.items,
              subtotal: orders.subtotal,
              total: orders.total,
              status: orders.status,
              paymentMethod: orders.paymentMethod,
              paymentStatus: orders.paymentStatus,
              deliveryAddress: orders.deliveryAddress,
              createdAt: orders.createdAt,
              updatedAt: orders.updatedAt,
              customerName: profiles.fullName,
              customerEmail: profiles.email,
              customerPhone: profiles.phone,
              customerIdNumber: profiles.idNumber,
              customerCounty: profiles.countyRegion,
              customerFarmingType: profiles.natureOfAgriculture,
            })
            .from(orders)
            .leftJoin(profiles, eq(orders.userId, profiles.id))
            .orderBy(desc(orders.createdAt))
            .limit(100);

          return new Response(JSON.stringify({ success: true, orders: rawOrders }), {
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
          const { id, status, actorId = "system-admin" } = body;

          await db
            .update(orders)
            .set({ status, updatedAt: new Date() })
            .where(eq(orders.id, id));

          await logAdminAction({
            actorId,
            action: `ORDER_STATUS_${status.toUpperCase()}`,
            entity: "orders",
            entityId: id,
            diff: { status },
          });

          return new Response(
            JSON.stringify({ success: true, message: `Order status advanced to ${status}` }),
            { headers: { "Content-Type": "application/json" } }
          );
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
