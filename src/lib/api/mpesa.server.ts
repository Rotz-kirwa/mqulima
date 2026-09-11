import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const StkPushInput = z.object({
  phone: z.string().min(1, "Phone number is required"),
  orderId: z.string().uuid("Invalid order ID format"),
  amount: z.number().positive().optional(), // Advisory only - overridden by server order total
  description: z.string().optional()
});

export const initiateStkPush = createServerFn({ method: "POST" })
  .inputValidator(StkPushInput)
  .handler(async ({ data }) => {
    try {
      const { phone, orderId, description } = data;

      // 1. Authenticate caller and load order authoritatively from DB
      const { getCurrentUser, getCurrentAdminUser } = await import("../auth-server");
      const user = (await getCurrentUser()) || (await getCurrentAdminUser());
      if (!user) {
        return {
          success: false,
          error: "Authentication required to initiate payment."
        };
      }

      const { getDb } = await import("../db.server");
      const sql = getDb();

      // Fetch order from DB and verify ownership & status
      const [order] = await sql`
        SELECT id, user_id, total, status, payment_status
        FROM orders
        WHERE id = ${orderId} AND deleted_at IS NULL
        LIMIT 1
      `;

      if (!order) {
        return { success: false, error: `Order ${orderId} not found.` };
      }

      const isAdmin = user.role === "admin" || user.role === "super_admin";
      if (!isAdmin && order.user_id !== user.id) {
        return { success: false, error: "Unauthorized: You do not have permission to pay for this order." };
      }

      if (order.payment_status === "paid" || order.status === "paid") {
        return { success: false, error: "This order has already been paid and completed." };
      }

      const serverAmount = Math.ceil(parseFloat(order.total));
      if (isNaN(serverAmount) || serverAmount <= 0) {
        return { success: false, error: "Invalid order total amount calculated on server." };
      }

      // Idempotency check: check if active pending payment was initiated in last 60 seconds
      const [existingPending] = await sql`
        SELECT id, provider_ref, created_at
        FROM payments
        WHERE order_id = ${orderId}
          AND provider = 'mpesa'
          AND status = 'pending'
          AND created_at > NOW() - INTERVAL '60 seconds'
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (existingPending) {
        return {
          success: true,
          checkoutRequestId: existingPending.provider_ref,
          paymentId: existingPending.id,
          message: "A payment prompt was recently sent. Please check your phone."
        };
      }

      // 2. Phone number normalisation
      let cleanPhone = phone.replace(/[^0-9]/g, "");
      if (cleanPhone.startsWith("0")) {
        cleanPhone = "254" + cleanPhone.slice(1);
      } else if (cleanPhone.startsWith("+")) {
        cleanPhone = cleanPhone.slice(1);
      } else if (!cleanPhone.startsWith("254")) {
        cleanPhone = "254" + cleanPhone;
      }

      if (!/^254[0-9]{9}$/.test(cleanPhone)) {
        return {
          success: false,
          error: "Invalid phone number format. Must be a valid Kenyan mobile number (e.g. 0712345678)"
        };
      }

      // 3. Fetch OAuth Token via helper
      const { getMpesaToken, clearMpesaTokenCache } = await import("../mpesa-helpers.server");
      let token = await getMpesaToken();
      const isProduction = process.env.MPESA_ENVIRONMENT !== "sandbox";

      // 4. Setup credentials
      const shortcode = (process.env.MPESA_SHORTCODE || "").trim();
      const passkey = (process.env.MPESA_PASSKEY || "").trim();

      if (!shortcode || !passkey) {
        throw new Error("M-Pesa Shortcode or Passkey is not configured in environment variables.");
      }
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
      const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

      const { getMpesaWebhookSecret } = await import("../mpesa-helpers.server");
      const webhookSecret = getMpesaWebhookSecret();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || "https://mqulima.co.ke";
      const callbackUrl = `${appUrl.replace(/\/$/, "")}/api/mpesa/callback?token=${webhookSecret}`;

      const payload = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: serverAmount,
        PartyA: cleanPhone,
        PartyB: shortcode,
        PhoneNumber: cleanPhone,
        CallBackURL: callbackUrl,
        AccountReference: ("MQ" + orderId.replace(/-/g, "")).slice(0, 12),
        TransactionDesc: (description || "ShopOrder").slice(0, 13)
      };

      const baseUrl = isProduction ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

      console.log(`[M-PESA] Dispatching STK push request to Daraja (${isProduction ? "Production" : "Sandbox"}):`, callbackUrl);

      // 4. Send request to Safaricom Daraja API
      let response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      let responseText = await response.text();
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { responseText };
      }

      // If token was rejected by Safaricom, force-refresh token and retry once
      if (responseData?.errorMessage?.includes("Invalid Access Token") || responseData?.errorCode === "404.001.03") {
        console.warn("[M-PESA] Cached token was rejected by Safaricom. Fetching fresh token and retrying STK Push...");
        clearMpesaTokenCache();
        token = await getMpesaToken(true);

        response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        responseText = await response.text();
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          responseData = { responseText };
        }
      }

      if (!response.ok || responseData.ResponseCode !== "0") {
        return {
          success: false,
          error: `M-Pesa STK Push rejected: ${responseData.ResponseDescription || responseData.errorMessage || "Gateway request failed"}`
        };
      }

      const checkoutRequestId = responseData.CheckoutRequestID;

      // 5. Save pending record in payments
      const [insertedPayment] = await sql`
        INSERT INTO payments (order_id, provider, amount, status, provider_ref, raw_payload)
        VALUES (${orderId}, 'mpesa', ${serverAmount}, 'pending', ${checkoutRequestId}, ${JSON.stringify(responseData)}::jsonb)
        RETURNING id
      `;

      return {
        success: true,
        checkoutRequestId,
        paymentId: insertedPayment.id
      };
    } catch (err: any) {
      console.error("[INITIATE STK PUSH ERROR]:", err);
      return {
        success: false,
        error: err?.message || "Failed to trigger M-Pesa push prompt."
      };
    }
  });

export const getPaymentStatus = createServerFn({ method: "GET" })
  .inputValidator(z.object({
    orderId: z.string().uuid()
  }))
  .handler(async ({ data }) => {
    const { orderId } = data;

    const { getCurrentUser, getCurrentAdminUser } = await import("../auth-server");
    const user = (await getCurrentUser()) || (await getCurrentAdminUser());

    if (!user) {
      throw new Error("Unauthorized: Authentication required to view payment status.");
    }

    const { getDb } = await import("../db.server");
    const sql = getDb();

    // Verify order ownership or admin role (IDOR Protection)
    const [payment] = await sql`
      SELECT p.status, p.provider_ref
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE p.order_id = ${orderId} 
        AND p.provider = 'mpesa'
        AND (o.user_id = ${user.id} OR ${user.role} IN ('admin', 'super_admin'))
      ORDER BY p.created_at DESC
      LIMIT 1
    `;

    return {
      status: payment?.status || "pending",
      reference: payment?.provider_ref || null
    };
  });
