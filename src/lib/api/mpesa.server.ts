import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const StkPushInput = z.object({
  phone: z.string(),
  amount: z.number().positive(),
  orderId: z.string().uuid(),
  description: z.string()
});

export const initiateStkPush = createServerFn({ method: "POST" })
  .inputValidator(StkPushInput)
  .handler(async ({ data }) => {
    try {
      const { phone, amount, orderId, description } = data;

      // 1. Phone number normalisation
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

      // 2. Fetch OAuth Token via helper
      const { getMpesaToken, clearMpesaTokenCache } = await import("../mpesa-helpers.server");
      let token = await getMpesaToken();
      const isProduction = process.env.MPESA_ENVIRONMENT !== "sandbox";

      // 3. Setup credentials
      const shortcode = (process.env.MPESA_SHORTCODE || "4183765").trim();
      const passkey = (process.env.MPESA_PASSKEY || "3fa9c7374620831d9c3d34a5279fd8ce4d51edbb067886b0c5b5f15bd27b47f4").trim();
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
        Amount: Math.ceil(amount),
        PartyA: cleanPhone,
        PartyB: shortcode,
        PhoneNumber: cleanPhone,
        CallBackURL: callbackUrl,
        AccountReference: ("MQ" + orderId.replace(/-/g, "")).slice(0, 12),
        TransactionDesc: "ShopOrder".slice(0, 13)
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
      const { getDb } = await import("../db.server");
      const sql = getDb();

      const [insertedPayment] = await sql`
        INSERT INTO payments (order_id, provider, amount, status, provider_ref, raw_payload)
        VALUES (${orderId}, 'mpesa', ${Math.ceil(amount)}, 'pending', ${checkoutRequestId}, ${JSON.stringify(responseData)}::jsonb)
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
    const { getDb } = await import("../db.server");
    const sql = getDb();

    const [payment] = await sql`
      SELECT status, provider_ref
      FROM payments
      WHERE order_id = ${orderId} AND provider = 'mpesa'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return {
      status: payment?.status || "pending",
      reference: payment?.provider_ref || null
    };
  });
