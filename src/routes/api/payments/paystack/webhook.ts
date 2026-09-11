import { createFileRoute } from "@tanstack/react-router";
import { PaymentService } from "@/lib/payments/services/payment.service";

export const Route = createFileRoute("/api/payments/paystack/webhook")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          // 1. Extract raw body text (mandatory for HMAC SHA-512 signature verification)
          const rawBody = await request.text();
          const signatureHeader = request.headers.get("x-paystack-signature");

          if (!rawBody || !signatureHeader) {
            console.warn("[PAYSTACK WEBHOOK REJECTED] Missing payload body or x-paystack-signature header.");
            return new Response(
              JSON.stringify({ success: false, error: "Missing signature or body payload." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          let payload: any;
          try {
            payload = JSON.parse(rawBody);
          } catch (e) {
            return new Response(
              JSON.stringify({ success: false, error: "Invalid JSON format." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // 2. Delegate HMAC SHA-512 verification & event processing to PaymentService
          const result = await PaymentService.handlePaystackWebhook(rawBody, signatureHeader, payload);

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err: any) {
          console.error("[PAYSTACK WEBHOOK EXCEPTION]:", err);
          return new Response(
            JSON.stringify({ success: false, error: err?.message || "Webhook processing error." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }
  }
});
