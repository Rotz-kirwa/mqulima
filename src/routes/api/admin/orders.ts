import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { orders } from "@/db/schema/orders";
import { profiles } from "@/db/schema/profiles";
import { eq, desc, or, sql } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";
import { invalidateAnalyticsCache } from "./analytics";
import crypto from "crypto";

export const Route = createFileRoute("/api/admin/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request, "orders.read");
        if ("response" in auth) return auth.response;
        try {
          const { getDb } = await import("@/lib/db.server");
          const sqlClient = getDb();

          // An order is recorded ONLY if paid and confirmed after successful payment confirmation has been received
          const rawOrders = await sqlClient`
            SELECT 
              o.id,
              o.user_id AS "userId",
              o.items,
              o.subtotal,
              o.total,
              o.status,
              o.payment_method AS "paymentMethod",
              o.payment_status AS "paymentStatus",
              o.delivery_address AS "deliveryAddress",
              o.checkout_channel AS "checkoutChannel",
              o.notes,
              o.created_at AS "createdAt",
              o.updated_at AS "updatedAt",
              p.full_name AS "customerName",
              p.email AS "customerEmail",
              p.phone AS "customerPhone",
              p.id_number AS "customerIdNumber",
              p.county_region AS "customerCounty",
              p.nature_of_agriculture AS "customerFarmingType",
              pay.receipt_number AS "paymentReceipt",
              pay.provider_ref AS "paymentProviderRef",
              pay.provider AS "paymentProvider",
              pay.completed_at AS "paymentCompletedAt"
            FROM orders o
            INNER JOIN payments pay ON pay.order_id = o.id
            LEFT JOIN profiles p ON p.id = o.user_id
            WHERE o.deleted_at IS NULL
              AND o.payment_status = 'paid'
              AND o.status IN ('confirmed', 'paid', 'processing', 'shipped', 'delivered')
              AND pay.status = 'paid'
              AND (
                pay.receipt_number IS NOT NULL 
                OR pay.result_code = '0' 
                OR (pay.provider_ref IS NOT NULL AND pay.provider_ref NOT LIKE 'MPESA-STK-%')
              )
            ORDER BY o.created_at DESC
            LIMIT 100
          `;

          // Deduplicate if an order has multiple payment attempts
          const orderMap = new Map<string, any>();
          for (const row of rawOrders) {
            if (!orderMap.has(row.id)) {
              orderMap.set(row.id, row);
            }
          }
          const recordedOrders = Array.from(orderMap.values());

          return new Response(JSON.stringify({ success: true, orders: recordedOrders }), {
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
          const { id, status, paymentStatus, paymentRef, actorId = "system-admin" } = body;

          if (!id || (!status && !paymentStatus)) {
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
              SELECT id, status, payment_status, items
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

            const targetStatus = status || previousStatus;
            const isConfirmedOrPaid = 
              targetStatus === "confirmed" || 
              targetStatus === "paid" || 
              paymentStatus === "paid";

            if (isConfirmedOrPaid) {
              // Verify if there is already a verified payment confirmation
              const [verifiedPayment] = await tx`
                SELECT id, status, receipt_number, provider_ref, result_code
                FROM payments
                WHERE order_id = ${id}
                  AND status = 'paid'
                  AND (
                    receipt_number IS NOT NULL 
                    OR result_code = '0' 
                    OR (provider_ref IS NOT NULL AND provider_ref NOT LIKE 'MPESA-STK-%')
                  )
                LIMIT 1
              `;

              if (!verifiedPayment) {
                if (!paymentRef || typeof paymentRef !== "string" || paymentRef.trim().length < 3) {
                  throw new Error("Cannot record or confirm order without verified payment confirmation receipt. Only paid and confirmed orders with valid payment confirmation can be recorded.");
                }

                const cleanRef = paymentRef.trim();
                // Update or insert verified payment record
                const [existingPay] = await tx`SELECT id FROM payments WHERE order_id = ${id} LIMIT 1`;
                if (existingPay) {
                  await tx`
                    UPDATE payments
                    SET status = 'paid',
                        receipt_number = ${cleanRef},
                        provider_ref = ${cleanRef},
                        result_code = '0',
                        result_description = 'Payment confirmed and verified with receipt',
                        completed_at = NOW(),
                        updated_at = NOW()
                    WHERE id = ${existingPay.id}
                  `;
                } else {
                  await tx`
                    INSERT INTO payments (
                      id, order_id, amount, status, provider, provider_ref, receipt_number, result_code, result_description, completed_at, created_at, updated_at
                    )
                    VALUES (
                      ${crypto.randomUUID()},
                      ${id},
                      ${order.total || "0"},
                      'paid',
                      'manual_verification',
                      ${cleanRef},
                      ${cleanRef},
                      '0',
                      'Payment confirmed manually by admin with verified receipt',
                      NOW(),
                      NOW(),
                      NOW()
                    )
                  `;
                }
              }

              await tx`
                UPDATE orders
                SET status = ${targetStatus}, 
                    payment_status = 'paid', 
                    updated_at = NOW()
                WHERE id = ${id}
              `;
            } else if (targetStatus === "cancelled") {
              await tx`
                UPDATE orders
                SET status = 'cancelled', 
                    updated_at = NOW()
                WHERE id = ${id}
              `;
            } else {
              // Fulfillment state updates (processing, shipped, delivered) require the order to be paid
              if (order.payment_status !== "paid" && targetStatus !== "pending") {
                throw new Error("Order cannot be processed or delivered before payment confirmation has been received.");
              }

              await tx`
                UPDATE orders
                SET status = ${targetStatus}, 
                    payment_status = ${paymentStatus || order.payment_status || "pending"},
                    updated_at = NOW()
                WHERE id = ${id}
              `;
            }

            await logAdminAction({
              actorId: auth.user?.id || actorId,
              action: `ORDER_STATUS_${targetStatus.toUpperCase()}`,
              entity: "orders",
              entityId: id,
              diff: { previousStatus, newStatus: targetStatus, paymentStatus: isConfirmedOrPaid ? "paid" : (paymentStatus || order.payment_status), inventoryRestored: restored },
            });
          });

          invalidateAnalyticsCache();

          return new Response(
            JSON.stringify({
              success: true,
              message: `Order status updated to ${status}${restored ? " and inventory restored" : ""}`,
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (error: any) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
