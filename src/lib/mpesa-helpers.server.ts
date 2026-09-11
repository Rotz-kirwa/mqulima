import { sendSms } from "./sms-service.server";
import { createHash } from "node:crypto";

// Cache token in memory
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export function clearMpesaTokenCache() {
  cachedToken = null;
  tokenExpiresAt = 0;
}

export async function getMpesaToken(_forceRefresh = false): Promise<string> {
  const isProduction = process.env.MPESA_ENVIRONMENT !== "sandbox";
  const consumerKey = (process.env.MPESA_CONSUMER_KEY || "").trim();
  const consumerSecret = (process.env.MPESA_CONSUMER_SECRET || "").trim();

  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa Consumer Key or Secret not configured. Set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET environment variables.");
  }

  try {
    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    const baseUrl = isProduction ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

    console.log(`[M-PESA] Fetching OAuth token from ${baseUrl}...`);

    const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[M-PESA] Failed to generate access token from Safaricom. Status:", response.status, "Body:", errText);
      throw new Error(`Safaricom OAuth failed (${response.status}): ${errText || response.statusText}`);
    }

    const data = await response.json();
    if (!data.access_token) {
      throw new Error("M-Pesa access token missing from Safaricom response.");
    }

    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + 55 * 60 * 1000; // cache for 55 minutes
    console.log("[M-PESA] OAuth token successfully generated!");
    return data.access_token as string;
  } catch (error: any) {
    console.error("[M-PESA] OAuth Token Generation Error:", error);
    throw new Error(error?.message || "Failed to generate M-Pesa access token from Safaricom.");
  }
}

export function getMpesaWebhookSecret(): string {
  if (process.env.MPESA_WEBHOOK_SECRET) {
    return process.env.MPESA_WEBHOOK_SECRET;
  }
  const isProduction = process.env.NODE_ENV === "production";
  const base = process.env.JWT_SECRET || process.env.MPESA_PASSKEY;
  if (!base) {
    if (isProduction) {
      throw new Error("[FATAL SECURITY ERROR] Missing MPESA_WEBHOOK_SECRET, JWT_SECRET, or MPESA_PASSKEY in production environment.");
    }
    console.warn("[M-PESA WEBHOOK SECURITY WARNING] Webhook secrets unconfigured in development. Using dev fallback.");
    return createHash("sha256").update("mqulima-mpesa-webhook-secure-key-dev").digest("hex").slice(0, 32);
  }
  return createHash("sha256").update(base).digest("hex").slice(0, 32);
}

export async function handleMpesaCallback(payload: any, request?: Request) {
  // Enforce Security Token Verification on all incoming callback requests
  if (request) {
    const url = new URL(request.url);
    const tokenQuery = url.searchParams.get("token");
    const tokenHeader = request.headers.get("x-mpesa-secret");
    const expectedSecret = getMpesaWebhookSecret();

    if (!tokenQuery && !tokenHeader) {
      console.error("[M-PESA] Webhook request missing security token. Callback rejected.");
      throw new Error("Unauthorized M-Pesa callback: security token missing");
    }

    if (tokenQuery !== expectedSecret && tokenHeader !== expectedSecret) {
      console.error("[M-PESA] Webhook security token mismatch. Rejected unauthorized callback.");
      throw new Error("Unauthorized M-Pesa callback: security token validation failed");
    }
  }

  const stkCallback = payload?.Body?.stkCallback;
  if (!stkCallback) {
    throw new Error("Invalid M-Pesa callback body");
  }

  const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;
  const { getDb } = await import("./db.server");
  const sql = getDb();

  // Find the associated payment
  const [payment] = await sql`
    SELECT id, order_id, amount
    FROM payments
    WHERE provider_ref = ${CheckoutRequestID}
  `;

  if (!payment) {
    console.error(`[M-PESA] Callback checkout ID not matched: ${CheckoutRequestID}`);
    throw new Error(`Payment record not found for CheckoutRequestID: ${CheckoutRequestID}`);
  }

  const { writeAuditLog } = await import("./audit.server");

  // Atomic database transaction for payment state reconciliation
  await sql.begin(async (tx: any) => {
    // Lock payment record for concurrent callback safety
    const [currentPayment] = await tx`
      SELECT id, order_id, amount, status
      FROM payments
      WHERE id = ${payment.id}
      FOR UPDATE
    `;

    if (!currentPayment) {
      throw new Error(`Payment record lock failed for CheckoutRequestID: ${CheckoutRequestID}`);
    }

    // IDEMPOTENCY GUARD 1: If payment is already marked paid, reject duplicate state changes & dispatches
    if (currentPayment.status === "paid" || currentPayment.status === "completed") {
      if (ResultCode === 0) {
        console.log(`[M-PESA IDEMPOTENCY] Duplicate success callback received for already paid payment #${currentPayment.id}. Skipping duplicate processing.`);
      } else {
        console.warn(`[M-PESA IDEMPOTENCY] Late failure callback received for already paid payment #${currentPayment.id}. Ignoring failure update.`);
      }
      return;
    }

    if (ResultCode === 0) {
      const items = stkCallback.CallbackMetadata?.Item || [];
      const receiptNumber = items.find((item: any) => item.Name === "MpesaReceiptNumber")?.Value;
      const paidAmount = items.find((item: any) => item.Name === "Amount")?.Value;

      const expectedAmount = Number(currentPayment.amount) || 0;
      const actualPaid = Number(paidAmount) || 0;

      let paymentState = "paid";
      let orderPaymentState = "paid";

      // Verification: Check if paid amount matches expected order total
      if (actualPaid > 0 && actualPaid < expectedAmount) {
        console.warn(`[M-PESA SECURITY WARNING] Payment amount mismatch for Order #${currentPayment.order_id}. Expected KSh ${expectedAmount}, received KSh ${actualPaid}.`);
        paymentState = "partial_paid";
        orderPaymentState = "partial_payment";
      }

      // Update payment to 'paid' or 'partial_paid'
      await tx`
        UPDATE payments
        SET status = ${paymentState}, provider_ref = ${receiptNumber || CheckoutRequestID}, raw_payload = ${tx.json(payload)}
        WHERE id = ${currentPayment.id}
      `;

      // Update orders table status
      await tx`
        UPDATE orders
        SET payment_status = ${orderPaymentState}
        WHERE id = ${currentPayment.order_id}
      `;

      // Write audit log
      await writeAuditLog({
        action: "payment.confirmed",
        actorId: null,
        entityType: "payment",
        entityId: currentPayment.id,
        diff: {
          orderId: currentPayment.order_id,
          checkoutRequestId: CheckoutRequestID,
          receiptNumber,
          expectedAmount,
          actualPaid,
          status: paymentState,
        }
      });

      console.log(`[M-PESA] Successfully processed payment for order: ${currentPayment.order_id} (Status: ${paymentState})`);

      // Fire Payment Confirmation SMS asynchronously (non-blocking)
      try {
        const [orderUser] = await tx`
          SELECT o.delivery_address, u.phone_number
          FROM orders o
          LEFT JOIN users u ON u.id = o.user_id
          WHERE o.id = ${currentPayment.order_id}
        `;

        let customerPhone: string | null = orderUser?.phone_number || null;
        if (!customerPhone && orderUser?.delivery_address) {
          const match = orderUser.delivery_address.match(/Phone:\s*([^\n]+)/i);
          if (match) customerPhone = match[1].trim();
        }

        if (customerPhone) {
          const shortOrderId = String(currentPayment.order_id).slice(0, 8).toUpperCase();
          const refCode = receiptNumber || CheckoutRequestID;
          const paySms = `Payment confirmed for Order #${shortOrderId}! KES ${actualPaid.toLocaleString()} received (Ref: ${refCode}). We are preparing your order. - Mqulima`;

          sendSms({
            phoneNumber: customerPhone,
            message: paySms,
            triggerType: "payment_confirmed",
          }).catch((err) => console.error("[M-PESA CALLBACK] Payment SMS error:", err));
        }
      } catch (smsErr) {
        console.error("[M-PESA CALLBACK] Failed to resolve customer phone for SMS:", smsErr);
      }
    } else {
      // IDEMPOTENCY GUARD 2: If payment is already marked failed, prevent duplicate stock restoration
      if (currentPayment.status === "failed") {
        console.warn(`[M-PESA IDEMPOTENCY] Duplicate failure callback received for payment #${currentPayment.id}. Skipping duplicate stock restoration.`);
        return;
      }

      // Payment failed or cancelled by user
      await tx`
        UPDATE payments
        SET status = 'failed', raw_payload = ${tx.json(payload)}
        WHERE id = ${currentPayment.id}
      `;

      // Fetch order details with FOR UPDATE lock for inventory restoration
      const [orderRecord] = await tx`
        SELECT id, items, status, payment_status
        FROM orders
        WHERE id = ${currentPayment.order_id}
        FOR UPDATE
      `;

      if (orderRecord && orderRecord.status !== "cancelled" && orderRecord.payment_status !== "failed") {
        // Mark order as cancelled due to payment failure
        await tx`
          UPDATE orders
          SET status = 'cancelled', payment_status = 'failed'
          WHERE id = ${currentPayment.order_id}
        `;

        // Restore inventory stock for each order item
        let restoredItemCount = 0;
        try {
          const rawItems = typeof orderRecord.items === "string"
            ? JSON.parse(orderRecord.items)
            : (orderRecord.items || []);

          if (Array.isArray(rawItems)) {
            for (const item of rawItems) {
              const productId = item.productId || item.id;
              const qty = Number(item.qty || item.quantity || 1);

              if (productId && qty > 0) {
                await tx`
                  UPDATE products
                  SET stock_qty = stock_qty + ${qty}, updated_at = NOW()
                  WHERE id = ${productId}
                `;
                restoredItemCount++;
              }
            }
          }
        } catch (itemErr) {
          console.error(`[M-PESA] Failed to parse order items for stock restoration on order ${payment.order_id}:`, itemErr);
        }

        // Write inventory restoration audit log
        await writeAuditLog({
          action: "inventory.restored_on_payment_failure",
          actorId: null,
          entityType: "order",
          entityId: payment.order_id,
          diff: {
            checkoutRequestId: CheckoutRequestID,
            restoredItemCount,
            reason: ResultDesc || "M-Pesa transaction cancelled or failed",
          }
        });

        console.log(`[M-PESA] Restored stock for ${restoredItemCount} items from cancelled order: ${payment.order_id}`);
      }

      // Write payment failure audit log
      await writeAuditLog({
        action: "payment.failed",
        actorId: null,
        entityType: "payment",
        entityId: payment.id,
        diff: {
          orderId: payment.order_id,
          checkoutRequestId: CheckoutRequestID,
          code: ResultCode,
          description: ResultDesc
        }
      });

      console.warn(`[M-PESA] Payment failed for checkout ID: ${CheckoutRequestID}. Code: ${ResultCode}, Desc: ${ResultDesc}`);
    }
  });
}

