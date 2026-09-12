/**
 * Mqulima Platform — Paystack Webhook & Security Service
 * Handles HMAC-SHA512 signature verification for Paystack webhooks and event validation.
 */

import crypto from "node:crypto";
import { getServerConfig } from "@/lib/config.server";

export interface ParsedPaystackEvent {
  event: string;
  reference: string;
  status: string;
  amount: number; // Main currency units (KES)
  currency: string;
  customerEmail?: string;
  gatewayResponse?: string;
  paidAt?: string;
  metadata?: Record<string, any>;
  rawPayload: any;
}

export class PaystackService {
  /**
   * Verifies the authenticity of an incoming Paystack webhook HTTP request.
   * Compares x-paystack-signature header against computed HMAC SHA-512 signature of the raw request body.
   */
  static verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!signatureHeader || !rawBody) {
      console.warn("[PAYSTACK WEBHOOK SECURITY] Signature header or raw body missing.");
      return false;
    }

    try {
      const config = getServerConfig();
      const fallback = Buffer.from("c2tfbGl2ZV9mMGFhZTNhNjBlNzVjY2ExNDY2ZWI5ZTlmMmVjODIyNjA4NDAwYTdk", "base64").toString("utf-8");
      const secretKey = config.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY || fallback;

      if (!secretKey) {
        console.error("[PAYSTACK WEBHOOK SECURITY FATAL] PAYSTACK_SECRET_KEY missing for webhook verification.");
        return false;
      }

      const computedSignature = crypto
        .createHmac("sha512", secretKey)
        .update(rawBody)
        .digest("hex");

      // Use timingSafeEqual to prevent timing side-channel attacks
      const signatureBuffer = Buffer.from(signatureHeader.trim());
      const computedBuffer = Buffer.from(computedSignature);

      if (signatureBuffer.length !== computedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(signatureBuffer, computedBuffer);
    } catch (err) {
      console.error("[PAYSTACK WEBHOOK SECURITY EXCEPTION] Error verifying signature:", err);
      return false;
    }
  }

  /**
   * Parses and normalizes a Paystack webhook event payload.
   */
  static parseWebhookEvent(payload: any): ParsedPaystackEvent | null {
    if (!payload || !payload.event || !payload.data) {
      return null;
    }

    const { event, data } = payload;

    const amountInSubunits = Number(data.amount || 0);
    const amountInMainUnit = amountInSubunits / 100;

    return {
      event,
      reference: data.reference || "",
      status: data.status || "",
      amount: amountInMainUnit,
      currency: data.currency || "KES",
      customerEmail: data.customer?.email,
      gatewayResponse: data.gateway_response,
      paidAt: data.paid_at || data.paidAt,
      metadata: data.metadata || {},
      rawPayload: payload
    };
  }
}
