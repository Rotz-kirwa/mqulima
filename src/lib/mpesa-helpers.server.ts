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

export async function handleMpesaCallback(payload: any) {
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

  if (ResultCode === 0) {
    const items = stkCallback.CallbackMetadata?.Item || [];
    const receiptNumber = items.find((item: any) => item.Name === "MpesaReceiptNumber")?.Value;

    // Update payment to 'paid' (enum constraint)
    await sql`
      UPDATE payments
      SET status = 'paid', provider_ref = ${receiptNumber || CheckoutRequestID}, raw_payload = ${sql.json(payload)}
      WHERE id = ${payment.id}
    `;

    // Update orders table status to 'paid'
    await sql`
      UPDATE orders
      SET payment_status = 'paid'
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
        amount: payment.amount
      }
    });

    console.log(`[M-PESA] Successfully completed payment for order: ${payment.order_id}`);
  } else {
    // Update payment to 'failed'
    await sql`
      UPDATE payments
      SET status = 'failed', raw_payload = ${sql.json(payload)}
      WHERE id = ${payment.id}
    `;

    // Write audit log
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
}
