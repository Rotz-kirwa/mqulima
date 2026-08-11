import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/lib/db.server";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";

export const Route = createFileRoute("/api/admin/payments")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          const sql = getDb();

          // 1. Fetch live orders with user details
          const ordersList = await sql`
            SELECT 
              o.id as order_id,
              o.user_id,
              o.items,
              o.subtotal,
              o.total,
              o.status as order_status,
              o.payment_method,
              o.payment_status,
              o.created_at as order_created_at,
              o.notes,
              u.first_name,
              u.last_name,
              u.phone_number,
              u.email,
              u.county
            FROM orders o
            LEFT JOIN users u ON u.id = o.user_id
            ORDER BY o.created_at DESC
          `;

          // 2. Fetch payments records
          const paymentsList = await sql`
            SELECT 
              p.id as payment_id,
              p.order_id,
              p.amount,
              p.status as payment_status,
              p.provider,
              p.provider_ref,
              p.raw_payload,
              p.created_at as payment_created_at
            FROM payments p
            ORDER BY p.created_at DESC
          `;

          const paymentByOrderId: Record<string, any> = {};
          for (const p of paymentsList) {
            if (p.order_id) {
              paymentByOrderId[p.order_id] = p;
            }
          }

          // 3. Auto-sync missing orders into payments ledger if needed
          for (const ord of ordersList) {
            if (!paymentByOrderId[ord.order_id]) {
              const pId = `pay-${ord.order_id.slice(0, 8)}`;
              const transRef = `MPESA-STK-${ord.order_id.slice(0, 6).toUpperCase()}`;
              const amountStr = String(ord.total || "0.00");
              const payStatus = ord.payment_status === "completed" || ord.payment_status === "paid" ? "paid" : "pending";

              await sql`
                INSERT INTO payments (id, order_id, amount, status, provider, provider_ref, raw_payload, created_at)
                VALUES (
                  ${pId},
                  ${ord.order_id},
                  ${amountStr},
                  ${payStatus},
                  ${ord.payment_method || "M-Pesa Express"},
                  ${transRef},
                  ${JSON.stringify({ phone: ord.phone_number || "+254700000000", channel: "website_checkout" })},
                  ${ord.order_created_at || new Date()}
                )
                ON CONFLICT (id) DO NOTHING
              `.catch(() => {});

              paymentByOrderId[ord.order_id] = {
                payment_id: pId,
                order_id: ord.order_id,
                amount: amountStr,
                payment_status: payStatus,
                provider: ord.payment_method || "M-Pesa Express",
                provider_ref: transRef,
                raw_payload: { phone: ord.phone_number || "+254700000000" },
                payment_created_at: ord.order_created_at,
              };
            }
          }

          // Re-query payments after sync
          const finalPayments = await sql`
            SELECT 
              p.id as payment_id,
              p.order_id,
              p.amount,
              p.status as payment_status,
              p.provider,
              p.provider_ref,
              p.raw_payload,
              p.created_at as payment_created_at,
              o.total as order_total,
              o.status as order_status,
              o.payment_method as order_payment_method,
              o.items as order_items_json,
              u.first_name,
              u.last_name,
              u.phone_number,
              u.email,
              u.county
            FROM payments p
            LEFT JOIN orders o ON o.id = p.order_id
            LEFT JOIN users u ON u.id = o.user_id
            ORDER BY p.created_at DESC
          `;

          const result = finalPayments.map((p: any) => {
            const rawPayload = typeof p.raw_payload === "string" 
              ? JSON.parse(p.raw_payload) 
              : (p.raw_payload || {});

            let itemsList: any[] = [];
            if (p.order_items_json) {
              try {
                itemsList = typeof p.order_items_json === "string" 
                  ? JSON.parse(p.order_items_json) 
                  : p.order_items_json;
              } catch (_) {}
            }

            const customerName = p.first_name || p.last_name
              ? `${p.first_name || ""} ${p.last_name || ""}`.trim()
              : "Guest Customer";

            const customerPhone = p.phone_number || rawPayload.phone || "+254 700 000000";
            const isOrphaned = !p.order_id || p.payment_status === "pending";

            return {
              id: p.payment_id,
              transactionId: p.provider_ref || `MPESA-${p.payment_id.slice(0, 8)}`,
              method: p.provider || p.order_payment_method || "M-Pesa Express",
              customerName,
              customerPhone,
              customerEmail: p.email || "N/A",
              customerCounty: p.county || "Nairobi",
              amountKsh: parseFloat(p.amount || p.order_total || 0),
              orderId: p.order_id,
              orderStatus: p.order_status || "pending",
              reconciliationStatus: isOrphaned ? "orphaned" : "matched",
              paymentStatus: p.payment_status || "pending",
              items: itemsList,
              createdAt: p.payment_created_at,
            };
          });

          return new Response(JSON.stringify({ success: true, payments: result }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error("Error fetching admin payments ledger:", error);
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
          const { action, paymentId, orderId, actorId = "system-admin" } = body;
          const sql = getDb();

          if (action === "reconcile") {
            await sql`
              UPDATE payments
              SET status = 'paid', order_id = ${orderId}
              WHERE id = ${paymentId}
            `;

            await sql`
              UPDATE orders
              SET payment_status = 'paid'
              WHERE id = ${orderId}
            `;

            await logAdminAction({
              actorId,
              action: "PAYMENT_RECONCILED_MANUAL",
              entity: "payments",
              entityId: paymentId,
              diff: { matchedOrderId: orderId },
            });

            return new Response(
              JSON.stringify({ success: true, message: `Payment ${paymentId} manually matched to Order #${orderId}` }),
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
