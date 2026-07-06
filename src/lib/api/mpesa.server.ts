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
      throw new Error("Invalid phone number format. Must be a valid Kenyan mobile number (e.g. 0712345678)");
    }

    // 2. Fetch OAuth Token via helper
    const { getMpesaToken, getMpesaEnv } = await import("../mpesa-helpers.server");
    const mpesaEnv = getMpesaEnv();
    const token = await getMpesaToken();
    const isProduction = (mpesaEnv.MPESA_ENVIRONMENT || process.env.MPESA_ENVIRONMENT) === "production";

    if (token === "mock_access_token") {
      console.log(`[M-PESA-SIMULATION] Simulating STK push for phone ${cleanPhone}, amount ${amount}`);
      const checkoutRequestId = `ws_CO_06072026164826_${Math.floor(100000000 + Math.random() * 900000000)}`;

      const { getDb } = await import("../db.server");
      const sql = getDb();

      // Insert pending payment record
      const [insertedPayment] = await sql`
        INSERT INTO payments (order_id, provider, amount, status, provider_ref, raw_payload)
        VALUES (${orderId}, 'mpesa', ${Math.ceil(amount)}, 'pending', ${checkoutRequestId}, ${sql.json({ simulated: true })})
        RETURNING id
      `;

      // Auto-confirm payment after 6 seconds
      setTimeout(async () => {
        try {
          console.log(`[M-PESA-SIMULATION] Auto-confirming simulated payment ${insertedPayment.id} for order ${orderId}`);
          await sql`
            UPDATE payments
            SET status = 'paid'
            WHERE id = ${insertedPayment.id}
          `;
          await sql`
            UPDATE orders
            SET payment_status = 'paid'
            WHERE id = ${orderId}
          `;
          console.log(`[M-PESA-SIMULATION] Successfully confirmed simulated payment for order ${orderId}`);
        } catch (e) {
          console.error("[M-PESA-SIMULATION] Auto-confirm error:", e);
        }
      }, 6000);

      return {
        success: true,
        checkoutRequestId,
        paymentId: insertedPayment.id
      };
    }

    // 3. Setup credentials
    const shortcode = mpesaEnv.MPESA_SHORTCODE || process.env.MPESA_SHORTCODE || "174379";
    const passkey = mpesaEnv.MPESA_PASSKEY || process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    const appUrl = mpesaEnv.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || "https://mqulima.co.ke";
    const callbackUrl = `${appUrl.replace(/\/$/, "")}/api/mpesa/callback`;

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
      AccountReference: "MQHub-" + orderId.slice(0, 8),
      TransactionDesc: description.slice(0, 20)
    };

    const baseUrl = isProduction ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

    console.log(`[M-PESA] Dispatching STK push request to Daraja (${isProduction ? "Production" : "Sandbox"}):`, callbackUrl);

    // 4. Send request to Safaricom Daraja API
    const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Invalid non-JSON response from Safaricom: ${responseText}`);
    }

    if (!response.ok || responseData.ResponseCode !== "0") {
      throw new Error(`M-Pesa STK Push rejected: ${responseData.ResponseDescription || responseData.errorMessage || "Unknown error"}`);
    }

    const checkoutRequestId = responseData.CheckoutRequestID;

    // 5. Save pending record in payments
    const { getDb } = await import("../db.server");
    const sql = getDb();

    const [insertedPayment] = await sql`
      INSERT INTO payments (order_id, provider, amount, status, provider_ref, raw_payload)
      VALUES (${orderId}, 'mpesa', ${Math.ceil(amount)}, 'pending', ${checkoutRequestId}, ${sql.json(responseData)})
      RETURNING id
    `;

    return {
      success: true,
      checkoutRequestId,
      paymentId: insertedPayment.id
    };
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
