import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { adminQuotations } from "@/db/schema/admin";
import { orders } from "@/db/schema/orders";
import { desc, eq } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";
import crypto from "crypto";

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
            const { paymentRef, paymentMethod = "mpesa", notes = "", actorId = "system-admin" } = body;

            if (!paymentRef || typeof paymentRef !== "string" || paymentRef.trim().length < 3) {
              return new Response(
                JSON.stringify({ 
                  success: false, 
                  error: "Payment confirmation reference (e.g. M-Pesa receipt # or Bank confirmation code) is required before converting a quotation to an active recorded order." 
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }

            const q = await db.select().from(adminQuotations).where(eq(adminQuotations.id, id));
            if (q.length === 0) {
              return new Response(JSON.stringify({ success: false, error: "Quotation not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
              });
            }

            const targetQ = q[0];
            const newOrderId = crypto.randomUUID();
            const cleanRef = paymentRef.trim();

            const { getDb } = await import("@/lib/db.server");
            const sql = getDb();

            await sql.begin(async (tx: any) => {
              // 1. Insert order with confirmed & paid status
              await tx`
                INSERT INTO orders (
                  id,
                  user_id,
                  items,
                  subtotal,
                  total,
                  status,
                  payment_method,
                  payment_status,
                  notes,
                  checkout_channel,
                  created_at,
                  updated_at
                )
                VALUES (
                  ${newOrderId},
                  ${targetQ.customerId || null},
                  ${JSON.stringify(targetQ.items || [])}::jsonb,
                  ${targetQ.totalAmountKsh},
                  ${targetQ.totalAmountKsh},
                  'confirmed',
                  ${paymentMethod},
                  'paid',
                  ${`B2B Quotation #${targetQ.id.slice(0, 8)} - Paid & Confirmed. Payment Ref: ${cleanRef}${notes ? ` - ${notes}` : ""}`},
                  'website',
                  NOW(),
                  NOW()
                )
              `;

              // 2. Insert verified payment confirmation record
              await tx`
                INSERT INTO payments (
                  id,
                  order_id,
                  amount,
                  status,
                  provider,
                  provider_ref,
                  receipt_number,
                  result_code,
                  result_description,
                  completed_at,
                  created_at,
                  updated_at
                )
                VALUES (
                  ${crypto.randomUUID()},
                  ${newOrderId},
                  ${targetQ.totalAmountKsh},
                  'paid',
                  ${paymentMethod},
                  ${cleanRef},
                  ${cleanRef},
                  '0',
                  'Payment confirmed and verified for B2B Quotation conversion',
                  NOW(),
                  NOW(),
                  NOW()
                )
              `;

              // 3. Mark quotation as converted
              await tx`
                UPDATE admin_quotations
                SET status = 'converted', updated_at = NOW()
                WHERE id = ${id}
              `;

              // 4. Log admin audit action
              await logAdminAction({
                actorId,
                action: "B2B_QUOTATION_CONVERTED_WITH_PAYMENT",
                entity: "admin_quotations",
                entityId: id,
                diff: { 
                  convertedOrderId: newOrderId, 
                  paymentRef: cleanRef, 
                  paymentMethod, 
                  amount: targetQ.totalAmountKsh 
                },
              });
            });

            return new Response(
              JSON.stringify({ 
                success: true, 
                message: "Quotation payment confirmed and order recorded successfully.", 
                orderId: newOrderId 
              }),
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
