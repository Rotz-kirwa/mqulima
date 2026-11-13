import { getDb } from "../db.server";
import { authenticateRequest } from "./auth-helper";
import {
  getMpesaToken,
  getMpesaWebhookSecret,
  handleMpesaCallback,
  queryMpesaStkStatus,
} from "../mpesa-helpers.server";
import { PaymentService } from "../payments/services/payment.service";
import { verifyPaystackTransactionApi } from "../payments/providers/paystack/paystack.api";

export async function handleMpesaStkPush(request: Request): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized. Sign in to initiate payment." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const { orderId, phone } = body;

    if (!orderId || !phone) {
      return new Response(
        JSON.stringify({ success: false, error: "orderId and phone are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sql = getDb();
    const [order] = await sql`
      SELECT id, user_id, total, status, payment_status
      FROM orders
      WHERE id = ${orderId} AND deleted_at IS NULL
      LIMIT 1
    `;

    if (!order) {
      return new Response(
        JSON.stringify({ success: false, error: `Order ${orderId} not found.` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (order.user_id !== user.id && user.role !== "admin" && user.role !== "super_admin") {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized access to this order." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (order.payment_status === "paid") {
      return new Response(
        JSON.stringify({ success: false, error: "Order is already paid." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (order.status === "cancelled" || order.payment_status === "failed") {
      return new Response(
        JSON.stringify({
          success: false,
          orderCancelled: true,
          error: "Previous payment attempt was cancelled. Please submit a new order to retry.",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Standardize Kenyan phone: 2547XXXXXXXX or 2541XXXXXXXX
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "254" + cleanPhone.slice(1);
    else if (cleanPhone.startsWith("+")) cleanPhone = cleanPhone.slice(1);
    else if (!cleanPhone.startsWith("254")) cleanPhone = "254" + cleanPhone;

    if (!/^254[0-9]{9}$/.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid Kenyan phone number format. Must be 07... or 01... (e.g. 0712345678)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const shortcode = (process.env.MPESA_SHORTCODE || "").trim();
    const passkey = (process.env.MPESA_PASSKEY || "").trim();
    if (!shortcode || !passkey) {
      return new Response(
        JSON.stringify({ success: false, error: "M-Pesa payment configuration is incomplete" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    const amount = Math.max(1, Math.ceil(parseFloat(order.total)));

    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");

    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const token = await getMpesaToken();
    const isProduction = process.env.MPESA_ENVIRONMENT !== "sandbox";
    const stkUrl = isProduction
      ? "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
      : "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

    const rawCallbackUrl = (process.env.MPESA_CALLBACK_URL || "https://mqulima.com/api/mpesa/callback").trim();
    const webhookSecret = getMpesaWebhookSecret();
    const callbackUrl = rawCallbackUrl.includes("token=")
      ? rawCallbackUrl
      : `${rawCallbackUrl}${rawCallbackUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(webhookSecret)}`;

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: cleanPhone,
      PartyB: shortcode,
      PhoneNumber: cleanPhone,
      CallBackURL: callbackUrl,
      AccountReference: orderId.slice(0, 12).toUpperCase(),
      TransactionDesc: `Mqulima Order ${orderId.slice(0, 8)}`,
    };

    const res = await fetch(stkUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPayload),
    });

    const data = await res.json();

    if (data.ResponseCode === "0") {
      // Record pending payment in DB
      await sql`
        INSERT INTO payments (
          order_id,
          provider,
          provider_ref,
          merchant_reference,
          phone_number,
          amount,
          status,
          currency
        )
        VALUES (
          ${orderId},
          'mpesa',
          ${data.CheckoutRequestID},
          ${data.MerchantRequestID || null},
          ${cleanPhone},
          ${amount},
          'pending',
          'KES'
        )
      `;

      return new Response(
        JSON.stringify({
          success: true,
          checkoutRequestId: data.CheckoutRequestID,
          merchantRequestId: data.MerchantRequestID,
          message: data.CustomerMessage || "STK push prompt sent to your phone. Enter your M-Pesa PIN to complete payment.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: data.errorMessage || data.ResponseDescription || "M-Pesa STK push request failed.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    console.error("[API/V1/MPESA-STK ERROR]:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to initiate M-Pesa payment." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handlePaymentStatus(orderId: string, request?: Request): Promise<Response> {
  const user = request ? await authenticateRequest(request) : null;
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized. Sign in to view payment status." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const sql = getDb();
    let [o] = await sql`
      SELECT id, user_id, status, payment_status
      FROM orders
      WHERE id = ${orderId} AND deleted_at IS NULL
      LIMIT 1
    `;

    if (!o) {
      return new Response(
        JSON.stringify({ success: false, error: `Order ${orderId} not found.` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const isAdmin = user.role === "admin" || user.role === "super_admin";
    if (!isAdmin && o.user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized access to this order." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    let [p] = await sql`
      SELECT id, status, provider, provider_ref, merchant_reference, receipt_number,
             result_code, result_description, failure_reason, amount, created_at, updated_at
      FROM payments
      WHERE order_id = ${orderId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    // Actively reconcile pending M-Pesa STK transactions directly with Daraja STK Query
    // so cancellations (1032) and completions are caught promptly even if callbacks are delayed.
    if (
      p?.status === "pending" &&
      o?.payment_status !== "paid" &&
      p?.provider === "mpesa" &&
      typeof p?.provider_ref === "string" &&
      p.provider_ref.startsWith("ws_CO_")
    ) {
      const ageMs = Date.now() - new Date(p.created_at).getTime();
      if (ageMs >= 6000) {
        const stkRes = await queryMpesaStkStatus(p.provider_ref);
        if (stkRes?.terminal) {
          const isSuccess = stkRes.resultCode === "0";
          // Wait up to 12s on success so async callback with MpesaReceiptNumber runs first if reachable
          if (!isSuccess || ageMs >= 12000) {
            await handleMpesaCallback({
              Body: {
                stkCallback: {
                  MerchantRequestID: p.merchant_reference || stkRes.merchantRequestId || "",
                  CheckoutRequestID: p.provider_ref,
                  ResultCode: Number(stkRes.resultCode),
                  ResultDesc: stkRes.resultDesc,
                },
              },
            }).catch((err) => console.warn("[M-PESA RECONCILE WARNING]:", err?.message || err));

            [p] = await sql`
              SELECT id, status, provider, provider_ref, merchant_reference, receipt_number,
                     result_code, result_description, failure_reason, amount, created_at, updated_at
              FROM payments
              WHERE order_id = ${orderId}
              ORDER BY created_at DESC
              LIMIT 1
            `;
            [o] = await sql`
              SELECT status, payment_status
              FROM orders
              WHERE id = ${orderId}
              LIMIT 1
            `;
          }
        }
      }
    } else if (
      p?.status === "pending" &&
      o?.payment_status !== "paid" &&
      p?.provider === "paystack" &&
      typeof p?.provider_ref === "string" &&
      p.provider_ref.length > 0
    ) {
      const verifyRes = await verifyPaystackTransactionApi(p.provider_ref).catch(() => null);
      if (verifyRes && (verifyRes.paid || verifyRes.status === "failed")) {
        await PaymentService.verifyPaystackPayment(p.provider_ref).catch((err) =>
          console.warn("[PAYSTACK RECONCILE WARNING]:", err?.message || err)
        );
        [p] = await sql`
          SELECT id, status, provider, provider_ref, merchant_reference, receipt_number,
                 result_code, result_description, failure_reason, amount, created_at, updated_at
          FROM payments
          WHERE order_id = ${orderId}
          ORDER BY created_at DESC
          LIMIT 1
        `;
        [o] = await sql`
          SELECT status, payment_status
          FROM orders
          WHERE id = ${orderId}
          LIMIT 1
        `;
      }
    }

    const isPaid = p?.status === "paid" || p?.status === "partial_paid" || o?.payment_status === "paid";
    const isFailed = !isPaid && (p?.status === "failed" || o?.payment_status === "failed" || o?.status === "cancelled");
    const resCode = String(p?.result_code || "");
    const message = p?.failure_reason || p?.result_description || null;
    const isCancelled = isFailed && (resCode === "1032" || /cancel/i.test(String(message || "")));

    return new Response(
      JSON.stringify({
        orderId,
        paid: isPaid,
        failed: isFailed,
        cancelled: isCancelled,
        status: isPaid ? "Paid" : isFailed ? "Failed" : (p?.status || o?.payment_status || "Pending"),
        receiptNumber: p?.receipt_number || null,
        provider: p?.provider || "mpesa",
        message,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handlePaystackInitialize(request: Request): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const { orderId, email, channels, paymentMethod, callbackUrl } = body;

    const resolvedChannels =
      Array.isArray(channels) && channels.length > 0
        ? channels
        : paymentMethod === "mpesa" || paymentMethod === "airtel" || paymentMethod === "airtel_money"
        ? ["mobile_money"]
        : paymentMethod === "visa" || paymentMethod === "mastercard"
        ? ["card"]
        : undefined;

    const isSafeCallback =
      typeof callbackUrl === "string" &&
      /^https?:\/\/(localhost(:\d+)?|127\.0\.0\.1(:\d+)?|([a-z0-9-]+\.)*mqulima\.com)(\/|$)/i.test(callbackUrl.trim());

    const result = await PaymentService.initiatePaystackPayment({
      orderId,
      userId: user.id,
      email: email || user.email,
      isAdmin: false,
      channels: resolvedChannels,
      callbackUrl: isSafeCallback ? callbackUrl.trim() : "https://mqulima.com/payments/paystack/callback",
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handlePaystackVerify(request: Request): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized. Sign in to verify payment." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { reference } = body;
    if (!reference) {
      return new Response(
        JSON.stringify({ success: false, error: "Transaction reference is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sql = getDb();
    const [existingOrder] = await sql`
      SELECT o.id, o.user_id
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE p.provider = 'paystack'
        AND (p.provider_ref = ${reference} OR p.merchant_reference = ${reference})
      LIMIT 1
    `;

    const isAdmin = user.role === "admin" || user.role === "super_admin";
    if (existingOrder && !isAdmin && existingOrder.user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized access to this payment transaction." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await PaymentService.verifyPaystackPayment(reference);
    if (result?.orderId && !existingOrder && !isAdmin) {
      const [verifiedOrder] = await sql`
        SELECT user_id FROM orders WHERE id = ${result.orderId} LIMIT 1
      `;
      if (verifiedOrder && verifiedOrder.user_id !== user.id) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized access to this payment transaction." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
