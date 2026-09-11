import { createFileRoute } from "@tanstack/react-router";
import { NcbaPaymentService } from "@/lib/payments/providers/ncba/ncba.service";
import { PaymentService } from "@/lib/payments/services/payment.service";

export const Route = createFileRoute("/api/payments/ncba/callback")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          // 1. Webhook Security Header / Token check
          const isSecure = NcbaPaymentService.validateWebhookSecurity(request);
          if (!isSecure) {
            return NcbaPaymentService.createCallbackResponse(false, "Unauthorized callback source.");
          }

          // 2. Parse JSON body
          const body = await request.json();
          const parsed = NcbaPaymentService.parseCallbackPayload(body);

          if (!parsed.isValid) {
            console.warn("[NCBA CALLBACK WARNING] Invalid callback payload:", parsed.error);
            return NcbaPaymentService.createCallbackResponse(false, parsed.error || "Invalid payload");
          }

          // 3. Process payment status update & order confirmation
          await PaymentService.handleNcbaCallback(parsed);

          // 4. Return standard 200 OK acknowledgment to NCBA Gateway
          return NcbaPaymentService.createCallbackResponse(true, "Callback processed successfully");
        } catch (err: any) {
          console.error("[NCBA CALLBACK ENDPOINT ERROR]:", err);
          // Always return 200 OK with error code to prevent gateway delivery retry storms
          return NcbaPaymentService.createCallbackResponse(false, err.message || "Internal callback processing error");
        }
      },
    },
  },
});
