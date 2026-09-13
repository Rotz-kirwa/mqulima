import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { orders } from "@/db/schema/orders";
import { profiles } from "@/db/schema/profiles";
import { eq, desc, or } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";

export const Route = createFileRoute("/api/admin/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request, "orders.read");
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
              checkoutChannel: orders.checkoutChannel,
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
            .where(
              or(
                eq(orders.paymentStatus, "paid"),
                eq(orders.checkoutChannel, "whatsapp")
              )
            )
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
        const auth = await requireAdminAuth(request, "orders.update");
        if ("response" in auth) return auth.response;
        try {
          const body = await request.json();
          const { id, status, actorId = "system-admin" } = body;

          if (!id || !status) {
            return new Response(JSON.stringify({ success: false, error: "Missing required parameters" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const { getDb } = await import("@/lib/db.server");
          const sql = getDb();

          let previousStatus = "";
          let restored = false;

          await sql.begin(async (tx: any) => {
            const [order] = await tx`
              SELECT id, status, items
              FROM orders
              WHERE id = ${id}
              FOR UPDATE
            `;

            if (!order) {
              throw new Error("Order not found");
            }

            previousStatus = order.status;

            // Restore stock exactly once on cancellation with transactional concurrency protection
            if (status === "cancelled" && previousStatus !== "cancelled") {
              const items = await tx`
                SELECT product_id, quantity
                FROM order_items
                WHERE order_id = ${id}
              `;

              if (items.length > 0) {
                for (const item of items) {
                  if (item.product_id && item.quantity > 0) {
                    await tx`
                      UPDATE products
                      SET stock_qty = stock_qty + ${item.quantity},
                          updated_at = NOW()
                      WHERE id = ${item.product_id}
                    `;
                  }
                }
              } else if (Array.isArray(order.items) && order.items.length > 0) {
                // Fallback to jsonb items array if order_items rows are absent
                for (const item of order.items) {
                  const pId = item.productId || item.id;
                  const qty = Number(item.quantity) || 0;
                  if (pId && qty > 0) {
                    await tx`
                      UPDATE products
                      SET stock_qty = stock_qty + ${qty},
                          updated_at = NOW()
                      WHERE id = ${pId}
                    `;
                  }
                }
              }
              restored = true;
            }

            await tx`
              UPDATE orders
              SET status = ${status}, updated_at = NOW()
              WHERE id = ${id}
            `;

            await logAdminAction({
              actorId: auth.user?.id || actorId,
              action: `ORDER_STATUS_${status.toUpperCase()}`,
              entity: "orders",
              entityId: id,
              diff: { previousStatus, newStatus: status, inventoryRestored: restored },
            });
          });

          return new Response(
            JSON.stringify({
              success: true,
              message: `Order status updated to ${status}${restored ? " and inventory restored" : ""}`,
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
    },
  },
});
