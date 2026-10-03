import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PaymentService } from "@/lib/payments/services/payment.service";
import { getCurrentUser } from "@/lib/auth-server";

const InitiatePaystackInputSchema = z.object({
  orderId: z.string().uuid("Invalid order ID format"),
  email: z.string().email("Invalid customer email address"),
  callbackUrl: z.string().url().optional(),
  channels: z.array(z.string()).optional()
});

/**
 * Server function to initiate a Paystack Card transaction.
 */
export const initiatePaystackCheckout = createServerFn({ method: "POST" })
  .inputValidator((val: unknown) => InitiatePaystackInputSchema.parse(val || {}))
  .handler(async ({ data }) => {
    try {
      let user = await getCurrentUser();
      const inputEmail = (data.email || "").trim().toLowerCase();

      // If user session is unverified or cookie expired, resolve against registered profile by email
      if (!user && inputEmail && inputEmail.includes("@")) {
        const { getDb } = await import("../db.server");
        const sql = getDb();
        const [matchedProfile] = await sql`
          SELECT id, email, full_name, role
          FROM profiles
          WHERE LOWER(email) = ${inputEmail} AND deleted_at IS NULL
          LIMIT 1
        `;
        if (matchedProfile) {
          user = {
            id: matchedProfile.id,
            name: matchedProfile.full_name,
            email: matchedProfile.email,
            role: matchedProfile.role,
            county: "",
            farmSize: "",
            crops: "",
            livestock: "",
          };
        }
      }

      const isAdmin = user ? (user.role === "admin" || user.role === "super_admin") : false;
      const effectiveUserId = user ? user.id : "guest";

      const result = await PaymentService.initiatePaystackPayment({
        orderId: data.orderId,
        userId: effectiveUserId,
        email: inputEmail || user?.email || "",
        isAdmin,
        callbackUrl: data.callbackUrl,
        channels: data.channels
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

const ChargeMobileMoneyInputSchema = z.object({
  orderId: z.string().uuid("Invalid order ID format"),
  phone: z.string().min(8, "Phone number is required"),
  email: z.string().email("Invalid customer email address"),
  provider: z.enum(["atl", "mpesa"])
});

/**
 * Server function to directly charge Airtel Money (or M-Pesa) via Paystack Charge API.
 * This sends the mobile prompt directly to the customer's phone without redirecting
 * them to Paystack's hosted page (which can mislabel the payment provider).
 */
export const chargePaystackMobileMoney = createServerFn({ method: "POST" })
  .inputValidator((val: unknown) => ChargeMobileMoneyInputSchema.parse(val || {}))
  .handler(async ({ data }) => {
    try {
      let user = await getCurrentUser();
      const inputEmail = (data.email || "").trim().toLowerCase();

      // If user session is unverified or cookie expired, resolve against registered profile by email
      if (!user && inputEmail && inputEmail.includes("@")) {
        const { getDb } = await import("../db.server");
        const sql = getDb();
        const [matchedProfile] = await sql`
          SELECT id, email, full_name, role
          FROM profiles
          WHERE LOWER(email) = ${inputEmail} AND deleted_at IS NULL
          LIMIT 1
        `;
        if (matchedProfile) {
          user = {
            id: matchedProfile.id,
            name: matchedProfile.full_name,
            email: matchedProfile.email,
            role: matchedProfile.role,
            county: "",
            farmSize: "",
            crops: "",
            livestock: "",
          };
        }
      }

      const isAdmin = user ? (user.role === "admin" || user.role === "super_admin") : false;
      const effectiveUserId = user ? user.id : "guest";

      const result = await PaymentService.chargePaystackMobileMoney({
        orderId: data.orderId,
        userId: effectiveUserId,
        phone: data.phone,
        email: inputEmail || user?.email || "",
        provider: data.provider,
        isAdmin
      });

      return result;
    } catch (err: any) {
      console.error("[CHARGE PAYSTACK MOBILE MONEY SERVER FN ERROR]:", err);
      return {
        success: false,
        error: err?.message || "Failed to initiate mobile money charge."
      };
    }
  });

