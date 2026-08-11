// Cache token in memory
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getMpesaToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const isProduction = process.env.MPESA_ENVIRONMENT === "production";
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    if (isProduction) {
      throw new Error("M-Pesa Consumer Key or Secret not configured in environment for production mode.");
    }
    console.warn("[M-PESA] Consumer Key or Secret not configured in environment. Activating sandbox payment simulation fallback.");
    return "mock_access_token";
  }

  try {
    const credentials = Buffer.from(`${consumerKey.trim()}:${consumerSecret.trim()}`).toString("base64");
    const baseUrl = isProduction ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

    const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[M-PESA] Failed to generate access token from Safaricom. Error body:", errText || "empty");
      
      const isLocalhost = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
      if (isProduction && !isLocalhost) {
        throw new Error(`Failed to generate M-Pesa access token: Safaricom returned ${response.status} ${response.statusText || "Bad Request"}. Please verify your MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in .env.`);
      }
      
      console.warn("[M-PESA] Safaricom production API rejected the request (likely due to localhost IP whitelisting). Activating sandbox payment simulation fallback.");
      return "mock_access_token";
    }

    const data = await response.json();
    if (!data.access_token) {
      const isLocalhost = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
      if (isProduction && !isLocalhost) {
        throw new Error("M-Pesa access token not found in authentication response.");
      }
      console.warn("[M-PESA] Token missing in response. Activating sandbox payment simulation fallback.");
      return "mock_access_token";
    }

    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + 55 * 60 * 1000; // cache for 55 minutes
    return cachedToken!;
  } catch (error: any) {
    console.error("[M-PESA] Fetch error during token generation:", error);
    const isLocalhost = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
    if (isProduction && !isLocalhost) {
      throw error;
    }
    console.warn("[M-PESA] Activating sandbox payment simulation fallback.");
    return "mock_access_token";
  }
}

export function getMpesaWebhookSecret(): string {
  if (process.env.MPESA_WEBHOOK_SECRET) {
    return process.env.MPESA_WEBHOOK_SECRET;
  }
  // Fallback: generate deterministic secret from JWT_SECRET or default fallback
  const base = process.env.JWT_SECRET || process.env.MPESA_PASSKEY || "mqulima-mpesa-secret-key-2026";
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(base).digest("hex").slice(0, 32);
}

export async function handleMpesaCallback(payload: any, request?: Request) {
  // Security Token Verification
  if (request) {
    const url = new URL(request.url);
    const tokenQuery = url.searchParams.get("token");
    const tokenHeader = request.headers.get("x-mpesa-secret");
    const expectedSecret = getMpesaWebhookSecret();

    // Enforce token check in production, or if token query parameter is passed
    const isProduction = process.env.MPESA_ENVIRONMENT === "production";
    if (isProduction || tokenQuery || tokenHeader) {
      if (tokenQuery !== expectedSecret && tokenHeader !== expectedSecret) {
        console.error("[M-PESA] Webhook security token mismatch. Rejected unauthorized callback.");
        throw new Error("Unauthorized M-Pesa callback: security token validation failed");
      }
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
    if (ResultCode === 0) {
      const items = stkCallback.CallbackMetadata?.Item || [];
      const receiptNumber = items.find((item: any) => item.Name === "MpesaReceiptNumber")?.Value;
      const paidAmount = items.find((item: any) => item.Name === "Amount")?.Value;

      const expectedAmount = Number(payment.amount) || 0;
      const actualPaid = Number(paidAmount) || 0;

      let paymentState = "paid";
      let orderPaymentState = "paid";

      // Verification: Check if paid amount matches expected order total
      if (actualPaid > 0 && actualPaid < expectedAmount) {
        console.warn(`[M-PESA SECURITY WARNING] Payment amount mismatch for Order #${payment.order_id}. Expected KSh ${expectedAmount}, received KSh ${actualPaid}.`);
        paymentState = "partial_paid";
        orderPaymentState = "partial_payment";
      }

      // Update payment to 'paid' or 'partial_paid'
      await tx`
        UPDATE payments
        SET status = ${paymentState}, provider_ref = ${receiptNumber || CheckoutRequestID}, raw_payload = ${tx.json(payload)}
        WHERE id = ${payment.id}
      `;

      // Update orders table status
      await tx`
        UPDATE orders
        SET payment_status = ${orderPaymentState}
        WHERE id = ${payment.order_id}
      `;

      // Write audit log
      await writeAuditLog({
        action: "payment.confirmed",
        actorId: null,
        entityType: "payment",
        entityId: payment.id,
        diff: {
          orderId: payment.order_id,
          checkoutRequestId: CheckoutRequestID,
          receiptNumber,
          expectedAmount,
          actualPaid,
          status: paymentState,
        }
      });

      console.log(`[M-PESA] Successfully processed payment for order: ${payment.order_id} (Status: ${paymentState})`);
    } else {
      // Payment failed or cancelled by user
      await tx`
        UPDATE payments
        SET status = 'failed', raw_payload = ${tx.json(payload)}
        WHERE id = ${payment.id}
      `;

      // Fetch order details for inventory restoration
      const [orderRecord] = await tx`
        SELECT id, items, status, payment_status
        FROM orders
        WHERE id = ${payment.order_id}
      `;

      if (orderRecord && orderRecord.status !== "cancelled") {
        // Mark order as cancelled due to payment failure
        await tx`
          UPDATE orders
          SET status = 'cancelled', payment_status = 'failed'
          WHERE id = ${payment.order_id}
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

