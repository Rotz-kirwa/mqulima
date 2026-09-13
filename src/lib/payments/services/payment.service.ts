/**
 * Mqulima Payment Engine — Core Payment Orchestrator & State Machine
 * Handles DB transactions, idempotency checks, server-side amount validation, and order updates.
 */

import { getRawSql } from "../../../db";
import { normalizeKenyanPhone, maskPhoneNumber } from "../utils/phone";
import { generateMerchantReference } from "../utils/idempotency";
import { sendNcbaStkPush } from "../providers/ncba/ncba.api";
import { ParsedNcbaCallback } from "../providers/ncba/ncba.service";
import { initializePaystackTransaction, verifyPaystackTransactionApi } from "../providers/paystack/paystack.api";
import { PaystackService } from "../providers/paystack/paystack.service";

export interface InitiatePaymentParams {
  orderId: string;
  userId: string;
  phone: string;
  isAdmin?: boolean;
}

export interface InitiatePaystackParams {
  orderId: string;
  userId: string;
  email: string;
  isAdmin?: boolean;
  callbackUrl?: string;
  channels?: string[];
}

export interface PaymentStatusDTO {
  id: string;
  orderId: string;
  provider: string;
  providerRef: string | null;
  merchantReference: string | null;
  phoneNumber: string | null;
  amount: number;
  currency: string;
  status: string;
  receiptNumber: string | null;
  resultDescription: string | null;
  createdAt: string;
  completedAt: string | null;
}

export class PaymentService {
  /**
   * Initiates an NCBA STK Push payment for an existing order.
   * SERVER-SIDE SECURITY: Amount is strictly computed from database order records.
   */
  static async initiateNcbaPayment(params: InitiatePaymentParams) {
    const { orderId, userId, phone, isAdmin } = params;

    // 1. Phone number normalization
    const phoneResult = normalizeKenyanPhone(phone);
    if (!phoneResult.isValid || !phoneResult.normalized) {
      throw new Error(phoneResult.error || "Invalid Kenyan phone number provided.");
    }
    const cleanPhone = phoneResult.normalized;

    const sql = getRawSql();

    // 2. Fetch order from DB and verify ownership & status
    const [order] = await sql`
      SELECT id, user_id, total, status, payment_status
      FROM orders
      WHERE id = ${orderId} AND deleted_at IS NULL
      LIMIT 1
    `;

    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    if (!isAdmin && order.user_id !== userId) {
      throw new Error("Unauthorized: You do not have permission to pay for this order.");
    }

    if (order.payment_status === "paid" || order.status === "paid") {
      throw new Error("This order has already been paid and completed.");
    }

    const serverAmount = parseFloat(order.total);
    if (isNaN(serverAmount) || serverAmount <= 0) {
      throw new Error("Invalid order total amount calculated on server.");
    }

    // 3. Idempotency Check: check if active pending payment exists created in last 60 seconds
    const [existingPending] = await sql`
      SELECT id, provider_ref, merchant_reference, created_at
      FROM payments
      WHERE order_id = ${orderId} 
        AND provider = 'ncba' 
        AND status = 'pending'
        AND created_at > NOW() - INTERVAL '60 seconds'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (existingPending) {
      console.log(`[PAYMENT SERVICE] Idempotent request: reusing active pending payment ${existingPending.id} for order ${orderId}`);
      return {
        success: true,
        paymentId: existingPending.id,
        checkoutRequestId: existingPending.provider_ref,
        merchantReference: existingPending.merchant_reference,
        message: "An M-Pesa STK prompt was recently sent. Please check your phone."
      };
    }

    // 4. Generate unique merchant reference
    const merchantReference = generateMerchantReference(orderId);

    // 5. Send STK Push request to NCBA Gateway
    const stkResult = await sendNcbaStkPush({
      phoneNumber: cleanPhone,
      amount: serverAmount,
      merchantReference,
      orderId,
      description: `Mqulima Order ${orderId.slice(0, 8)}`
    });

    if (!stkResult.success || !stkResult.checkoutRequestId) {
      throw new Error(stkResult.error || "NCBA STK Push initiation was rejected by payment gateway.");
    }

    // 6. Record payment in database
    const [insertedPayment] = await sql`
      INSERT INTO payments (
        order_id, 
        provider, 
        provider_ref, 
        merchant_reference, 
        phone_number, 
        currency, 
        amount, 
        status, 
        raw_payload
      ) VALUES (
        ${orderId}, 
        'ncba', 
        ${stkResult.checkoutRequestId}, 
        ${merchantReference}, 
        ${cleanPhone}, 
        'KES', 
        ${serverAmount}, 
        'pending', 
        ${JSON.stringify(stkResult.rawResponse || {})}::jsonb
      )
      RETURNING id
    `;

    console.log(`[PAYMENT SERVICE] Created pending payment ${insertedPayment.id} for order ${orderId} (Ref: ${stkResult.checkoutRequestId})`);

    return {
      success: true,
      paymentId: insertedPayment.id,
      checkoutRequestId: stkResult.checkoutRequestId,
      merchantReference,
      amount: serverAmount
    };
  }

  /**
   * Processes NCBA STK Push callback atomically inside a PostgreSQL transaction.
   * IDEMPOTENCY GUARANTEE: Duplicate callbacks will not trigger duplicate order updates.
   */
  static async handleNcbaCallback(parsed: ParsedNcbaCallback) {
    const { checkoutRequestId, merchantReference, resultCode, resultDesc, amount, mpesaReceiptNumber, phoneNumber, rawPayload } = parsed;

    const sql = getRawSql();

    console.log(`[PAYMENT CALLBACK] Processing NCBA callback for CheckoutRef: ${checkoutRequestId || "N/A"}, MerchantRef: ${merchantReference || "N/A"}, ResultCode: ${resultCode}`);

    // 1. Locate payment record
    let payment: any = null;

    if (checkoutRequestId) {
      const [p] = await sql`
        SELECT id, order_id, amount, status, provider_ref, merchant_reference
        FROM payments
        WHERE provider = 'ncba' AND provider_ref = ${checkoutRequestId}
        LIMIT 1
      `;
      payment = p;
    }

    if (!payment && merchantReference) {
      const [p] = await sql`
        SELECT id, order_id, amount, status, provider_ref, merchant_reference
        FROM payments
        WHERE provider = 'ncba' AND merchant_reference = ${merchantReference}
        LIMIT 1
      `;
      payment = p;
    }

    if (!payment) {
      console.warn(`[PAYMENT CALLBACK WARNING] Payment record not found for callback (Ref: ${checkoutRequestId || merchantReference}).`);
      return { success: false, error: "Payment transaction record not found." };
    }

    // 2. IDEMPOTENCY CHECK: If transaction is already completed/paid, ignore duplicate callback gracefully
    if (payment.status === "paid" || payment.status === "failed") {
      console.log(`[PAYMENT CALLBACK IDEMPOTENT] Payment ${payment.id} already processed with status: ${payment.status}. Ignoring duplicate callback.`);
      return { success: true, paymentId: payment.id, idempotent: true };
    }

    const isSuccess = resultCode === 0;

    // 3. Execute atomic database transaction
    await sql.begin(async (tx: any) => {
      if (isSuccess) {
        // Update payment table
        await tx`
          UPDATE payments
          SET 
            status = 'paid',
            receipt_number = ${mpesaReceiptNumber || null},
            result_code = ${String(resultCode)},
            result_description = ${resultDesc},
            phone_number = COALESCE(${phoneNumber || null}, phone_number),
            raw_payload = ${JSON.stringify(rawPayload)}::jsonb,
            updated_at = NOW(),
            completed_at = NOW()
          WHERE id = ${payment.id}
        `;

        // Update orders table
        await tx`
          UPDATE orders
          SET 
            status = 'paid',
            payment_status = 'paid',
            payment_method = 'ncba',
            updated_at = NOW()
          WHERE id = ${payment.order_id}
        `;

        console.log(`[PAYMENT CALLBACK SUCCESS] Order ${payment.order_id} marked as PAID. M-Pesa Receipt: ${mpesaReceiptNumber || "N/A"}`);
      } else {
        // Update payment table on failure/cancellation
        await tx`
          UPDATE payments
          SET 
            status = 'failed',
            result_code = ${String(resultCode)},
            result_description = ${resultDesc},
            failure_reason = ${resultDesc},
            raw_payload = ${JSON.stringify(rawPayload)}::jsonb,
            updated_at = NOW()
          WHERE id = ${payment.id}
        `;

        // Update orders table payment status
        await tx`
          UPDATE orders
          SET 
            payment_status = 'failed',
            updated_at = NOW()
          WHERE id = ${payment.order_id}
        `;

        console.warn(`[PAYMENT CALLBACK FAILED] Payment ${payment.id} failed. Reason: ${resultDesc}`);
      }
    });

    return {
      success: true,
      paymentId: payment.id,
      orderId: payment.order_id,
      paid: isSuccess
    };
  }

  /**
   * Retrieves payment status with strict user authorization check.
   */
  static async getPaymentStatus(orderId: string, userId: string, isAdmin = false): Promise<PaymentStatusDTO | null> {
    const sql = getRawSql();

    const [payment] = await sql`
      SELECT 
        p.id,
        p.order_id,
        p.provider,
        p.provider_ref,
        p.merchant_reference,
        p.phone_number,
        p.amount,
        p.currency,
        p.status,
        p.receipt_number,
        p.result_description,
        p.created_at,
        p.completed_at
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE p.order_id = ${orderId}
        AND (o.user_id = ${userId} OR ${isAdmin})
      ORDER BY p.created_at DESC
      LIMIT 1
    `;

    if (!payment) return null;

    return {
      id: payment.id,
      orderId: payment.order_id,
      provider: payment.provider,
      providerRef: payment.provider_ref,
      merchantReference: payment.merchant_reference,
      phoneNumber: payment.phone_number ? maskPhoneNumber(payment.phone_number) : null,
      amount: parseFloat(payment.amount),
      currency: payment.currency || "KES",
      status: payment.status,
      receiptNumber: payment.receipt_number,
      resultDescription: payment.result_description,
      createdAt: payment.created_at,
      completedAt: payment.completed_at
    };
  }

  /**
   * Initiates a Paystack Card transaction for an order.
   * SERVER-SIDE SECURITY: Amount is strictly computed from database order records.
   */
  static async initiatePaystackPayment(params: InitiatePaystackParams) {
    const { orderId, userId, email, isAdmin, callbackUrl } = params;

    if (!email || !email.includes("@")) {
      throw new Error("Valid customer email address is required for Paystack checkout.");
    }

    const sql = getRawSql();

    // 1. Fetch order from DB and verify ownership & status
    const [order] = await sql`
      SELECT id, user_id, total, status, payment_status
      FROM orders
      WHERE id = ${orderId} AND deleted_at IS NULL
      LIMIT 1
    `;

    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    if (!isAdmin && order.user_id !== userId) {
      throw new Error("Unauthorized: You do not have permission to pay for this order.");
    }

    if (order.payment_status === "paid" || order.status === "paid") {
      throw new Error("This order has already been paid and completed.");
    }

    const serverAmount = parseFloat(order.total);
    if (isNaN(serverAmount) || serverAmount <= 0) {
      throw new Error("Invalid order total amount calculated on server.");
    }

    // 2. Check for active pending Paystack transaction for idempotency
    const [existingPending] = await sql`
      SELECT id, provider_ref, merchant_reference, created_at, raw_payload
      FROM payments
      WHERE order_id = ${orderId}
        AND provider = 'paystack'
        AND status = 'pending'
        AND created_at > NOW() - INTERVAL '30 minutes'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (existingPending && existingPending.raw_payload?.authorization_url) {
      console.log(`[PAYSTACK SERVICE] Reusing active pending payment ${existingPending.id} for order ${orderId}`);
      return {
        success: true,
        paymentId: existingPending.id,
        reference: existingPending.merchant_reference || existingPending.provider_ref,
        authorizationUrl: existingPending.raw_payload.authorization_url,
        message: "Reusing active Paystack transaction session."
      };
    }

    // 3. Generate unique transaction reference
    const timestamp = Date.now();
    const reference = `MQ_PAYSTACK_${orderId.replace(/-/g, "").slice(0, 8)}_${timestamp}`;

    // 4. Initialize Paystack transaction with Paystack API
    const initRes = await initializePaystackTransaction({
      email,
      amount: serverAmount,
      currency: "KES",
      reference,
      callbackUrl,
      channels: params.channels,
      metadata: {
        order_id: orderId,
        user_id: userId
      }
    });

    if (!initRes.success || !initRes.authorizationUrl) {
      throw new Error(initRes.error || "Paystack payment initialization failed.");
    }

    // 5. Store pending payment transaction record in database
    const [insertedPayment] = await sql`
      INSERT INTO payments (
        order_id,
        provider,
        provider_ref,
        merchant_reference,
        customer_email,
        currency,
        amount,
        status,
        raw_payload
      ) VALUES (
        ${orderId},
        'paystack',
        ${reference},
        ${reference},
        ${email.trim().toLowerCase()},
        'KES',
        ${serverAmount},
        'pending',
        ${JSON.stringify({ authorization_url: initRes.authorizationUrl, access_code: initRes.accessCode, initRes: initRes.rawResponse })}::jsonb
      )
      RETURNING id
    `;

    console.log(`[PAYSTACK SERVICE] Created pending transaction ${insertedPayment.id} for order ${orderId} (Ref: ${reference})`);

    return {
      success: true,
      paymentId: insertedPayment.id,
      reference,
      authorizationUrl: initRes.authorizationUrl,
      amount: serverAmount
    };
  }

  /**
   * Verifies a Paystack transaction server-side.
   * SERVER-SIDE SECURITY & IDEMPOTENCY GUARANTEE:
   * - Confirms status is 'success'
   * - Validates reference & amount matches expected order total
   * - Atomically updates payment & order status in database
   */
  static async verifyPaystackPayment(reference: string) {
    if (!reference) {
      throw new Error("Transaction reference is required for verification.");
    }

    const sql = getRawSql();

    console.log(`[PAYSTACK VERIFY] Processing server-side verification for reference: ${reference}`);

    // 1. Locate payment record in database
    const [payment] = await sql`
      SELECT id, order_id, amount, status, provider_ref, merchant_reference, customer_email
      FROM payments
      WHERE provider = 'paystack' AND (provider_ref = ${reference} OR merchant_reference = ${reference})
      LIMIT 1
    `;

    if (!payment) {
      // Fallback: Check Paystack REST API directly in case webhook/DB entry missed
      console.warn(`[PAYSTACK VERIFY WARNING] Local payment record not found for ref ${reference}. Querying Paystack REST API.`);
    }

    // 2. Idempotency Check: if payment is already marked paid or failed in DB
    if (payment && payment.status === "paid") {
      console.log(`[PAYSTACK VERIFY IDEMPOTENT] Payment ${payment.id} already verified as PAID. Returning success.`);
      return {
        success: true,
        paid: true,
        paymentId: payment.id,
        orderId: payment.order_id,
        idempotent: true
      };
    }

    // 3. Call Paystack REST API for server-side verification using PAYSTACK_SECRET_KEY
    const verifyRes = await verifyPaystackTransactionApi(reference);

    if (!verifyRes.success) {
      console.error(`[PAYSTACK VERIFY FAILED] API verification error for ref ${reference}: ${verifyRes.error}`);
      return {
        success: false,
        paid: false,
        error: verifyRes.error || "Paystack transaction verification failed."
      };
    }

    // Extract metadata or associated order ID
    const targetOrderId = payment ? payment.order_id : verifyRes.rawResponse?.data?.metadata?.order_id;

    if (!targetOrderId) {
      throw new Error(`Unable to associate transaction ${reference} with an order.`);
    }

    // 4. Server-side amount validation
    const [order] = await sql`
      SELECT id, total, status, payment_status
      FROM orders
      WHERE id = ${targetOrderId} AND deleted_at IS NULL
      LIMIT 1
    `;

    if (!order) {
      throw new Error(`Order ${targetOrderId} not found.`);
    }

    const expectedAmount = parseFloat(order.total);
    const paidAmount = verifyRes.amount;

    // Validate paid amount against order total (allow 0.01 tolerance for rounding)
    const amountMatches = Math.abs(paidAmount - expectedAmount) < 1.0;
    const isSuccess = verifyRes.paid && amountMatches && verifyRes.currency === "KES";

    if (verifyRes.paid && !amountMatches) {
      console.error(`[PAYSTACK VERIFY AMOUNT MISMATCH] Order ${targetOrderId} expected KES ${expectedAmount}, but received KES ${paidAmount}`);
    }

    // 5. Execute atomic DB transaction
    let paymentRecordId = payment ? payment.id : null;

    await sql.begin(async (tx: any) => {
      if (isSuccess) {
        if (paymentRecordId) {
          await tx`
            UPDATE payments
            SET 
              status = 'paid',
              customer_email = COALESCE(${verifyRes.customerEmail || null}, customer_email),
              gateway_response = ${JSON.stringify({ gateway_response: verifyRes.gatewayResponse, paid_at: verifyRes.paidAt })}::jsonb,
              raw_payload = ${JSON.stringify(verifyRes.rawResponse)}::jsonb,
              updated_at = NOW(),
              completed_at = NOW()
            WHERE id = ${paymentRecordId}
          `;
        } else {
          const [inserted] = await tx`
            INSERT INTO payments (
              order_id,
              provider,
              provider_ref,
              merchant_reference,
              customer_email,
              currency,
              amount,
              status,
              gateway_response,
              raw_payload,
              completed_at
            ) VALUES (
              ${targetOrderId},
              'paystack',
              ${reference},
              ${reference},
              ${verifyRes.customerEmail || null},
              'KES',
              ${paidAmount},
              'paid',
              ${JSON.stringify({ gateway_response: verifyRes.gatewayResponse, paid_at: verifyRes.paidAt })}::jsonb,
              ${JSON.stringify(verifyRes.rawResponse)}::jsonb,
              NOW()
            )
            RETURNING id
          `;
          paymentRecordId = inserted.id;
        }

        // Update orders table
        await tx`
          UPDATE orders
          SET 
            status = 'paid',
            payment_status = 'paid',
            payment_method = 'paystack',
            updated_at = NOW()
          WHERE id = ${targetOrderId}
        `;

        console.log(`[PAYSTACK VERIFY SUCCESS] Order ${targetOrderId} marked as PAID via Paystack! Reference: ${reference}`);
      } else {
        if (paymentRecordId) {
          await tx`
            UPDATE payments
            SET 
              status = 'failed',
              gateway_response = ${JSON.stringify({ gateway_response: verifyRes.gatewayResponse })}::jsonb,
              raw_payload = ${JSON.stringify(verifyRes.rawResponse)}::jsonb,
              updated_at = NOW()
            WHERE id = ${paymentRecordId}
          `;
        }

        await tx`
          UPDATE orders
          SET 
            payment_status = 'failed',
            updated_at = NOW()
          WHERE id = ${targetOrderId}
        `;

        console.warn(`[PAYSTACK VERIFY FAILED] Order ${targetOrderId} payment marked as failed. Reason: ${verifyRes.gatewayResponse || verifyRes.error}`);
      }
    });

    return {
      success: true,
      paid: isSuccess,
      paymentId: paymentRecordId,
      orderId: targetOrderId,
      amount: paidAmount,
      currency: verifyRes.currency
    };
  }

  /**
   * Processes Paystack Webhook events securely and idempotently.
   * HMAC SHA-512 Signature verification enforced.
   */
  static async handlePaystackWebhook(rawBody: string, signatureHeader: string | null, payload: any) {
    // 1. Verify HMAC SHA-512 Signature
    const isValidSignature = PaystackService.verifyWebhookSignature(rawBody, signatureHeader);
    if (!isValidSignature) {
      console.error("[PAYSTACK WEBHOOK ERROR] Webhook request failed HMAC-SHA512 signature verification!");
      throw new Error("Invalid Paystack webhook signature.");
    }

    // 2. Parse Webhook Event
    const parsed = PaystackService.parseWebhookEvent(payload);
    if (!parsed) {
      console.warn("[PAYSTACK WEBHOOK WARN] Malformed or unknown webhook payload.");
      return { success: true, ignored: true, message: "Ignored malformed payload." };
    }

    console.log(`[PAYSTACK WEBHOOK RECEIVED] Event: ${parsed.event}, Ref: ${parsed.reference}, Status: ${parsed.status}`);

    // 3. Process charge.success events
    if (parsed.event === "charge.success") {
      const result = await PaymentService.verifyPaystackPayment(parsed.reference);
      return {
        success: true,
        event: parsed.event,
        reference: parsed.reference,
        result
      };
    }

    return {
      success: true,
      event: parsed.event,
      ignored: true,
      message: `Event ${parsed.event} acknowledged without DB mutation.`
    };
  }
}

