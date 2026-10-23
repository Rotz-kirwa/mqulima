import { getDb } from "../db.server";
import { authenticateRequest } from "./auth-helper";
import { getMpesaToken } from "../mpesa-helpers.server";
import { PaymentService } from "../payments/services/payment.service";

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

    const shortcode = (process.env.MPESA_SHORTCODE || "4183765").trim();
    const passkey = (process.env.MPESA_PASSKEY || "").trim();
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

    const callbackUrl = process.env.MPESA_CALLBACK_URL || "https://mqulima.com/api/mpesa/callback";

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
          phone_number,
          amount,
          status,
          currency
        )
        VALUES (
          ${orderId},
          'mpesa',
          ${data.CheckoutRequestID},
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

export async function handlePaymentStatus(orderId: string): Promise<Response> {
  try {
    const sql = getDb();
    const [p] = await sql`
      SELECT id, status, provider, provider_ref, receipt_number, amount, updated_at
      FROM payments
      WHERE order_id = ${orderId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const [o] = await sql`
      SELECT status, payment_status
      FROM orders
      WHERE id = ${orderId}
      LIMIT 1
    `;

    const isPaid = (p?.status === "paid") || (o?.payment_status === "paid");

    return new Response(
      JSON.stringify({
        orderId,
        paid: isPaid,
        status: isPaid ? "Paid" : (p?.status || o?.payment_status || "Pending"),
        receiptNumber: p?.receipt_number || null,
        provider: p?.provider || "mpesa",
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
    const { orderId, email } = body;

    const result = await PaymentService.initiatePaystackPayment({
      orderId,
      userId: user.id,
      email: email || user.email,
      isAdmin: false,
      callbackUrl: "https://mqulima.com/payments/paystack/callback",
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
  try {
    const body = await request.json();
    const { reference } = body;
    if (!reference) {
      return new Response(
        JSON.stringify({ success: false, error: "Transaction reference is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await PaymentService.verifyPaystackPayment(reference);
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
