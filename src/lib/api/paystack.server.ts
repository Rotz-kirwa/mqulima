import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PaymentService } from "@/lib/payments/services/payment.service";
import { getCurrentUser } from "@/lib/auth-server";

const InitiatePaystackInputSchema = z.object({
  orderId: z.string().uuid("Invalid order ID format"),
  email: z.string().email("Invalid customer email address"),
  callbackUrl: z.string().url().optional()
});

/**
 * Server function to initiate a Paystack Card transaction.
 */
export const initiatePaystackCheckout = createServerFn({ method: "POST" })
  .inputValidator((val: unknown) => InitiatePaystackInputSchema.parse(val || {}))
  .handler(async ({ data }) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return {
          success: false,
          error: "You must be logged in to process payment."
        };
      }

      const isAdmin = user.role === "admin" || user.role === "super_admin";

      const result = await PaymentService.initiatePaystackPayment({
        orderId: data.orderId,
        userId: user.id,
        email: data.email || user.email,
        isAdmin,
        callbackUrl: data.callbackUrl
      });

      return result;
    } catch (err: any) {
      console.error("[INITIATE PAYSTACK SERVER FN ERROR]:", err);
      return {
        success: false,
        error: err?.message || "Failed to initialize Paystack payment transaction."
      };
    }
  });

const VerifyPaystackInputSchema = z.object({
  reference: z.string().min(1, "Transaction reference is required")
});

/**
 * Server function to verify Paystack payment transaction status server-side.
 */
export const verifyPaystackPaymentStatus = createServerFn({ method: "POST" })
  .inputValidator((val: unknown) => VerifyPaystackInputSchema.parse(val || {}))
  .handler(async ({ data }) => {
    try {
      const result = await PaymentService.verifyPaystackPayment(data.reference);
      return result;
    } catch (err: any) {
      console.error("[VERIFY PAYSTACK SERVER FN ERROR]:", err);
      return {
        success: false,
        paid: false,
        error: err?.message || "Failed to verify Paystack payment status."
      };
    }
  });
