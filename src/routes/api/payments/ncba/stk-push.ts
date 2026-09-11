import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PaymentService } from "@/lib/payments/services/payment.service";

const NcbaStkPushSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  phone: z.string().min(1, "Phone number is required"),
  csrfToken: z.string().min(1, "CSRF token is required"),
});

export const Route = createFileRoute("/api/payments/ncba/stk-push")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          // 1. Authenticate user
          const { getCurrentUser, getCurrentAdminUser } = await import("@/lib/auth-server");
          const user = (await getCurrentUser()) || (await getCurrentAdminUser());

          if (!user) {
            return new Response(
              JSON.stringify({ success: false, error: "Unauthorized. Authentication required." }),
              { status: 401, headers: { "Content-Type": "application/json" } }
            );
          }

          // 2. Validate payload
          const body = await request.json();
          const parseResult = NcbaStkPushSchema.safeParse(body);

          if (!parseResult.success) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Invalid request payload",
                details: parseResult.error.flatten().fieldErrors,
              }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const { orderId, phone, csrfToken } = parseResult.data;

          // 3. Mandatory CSRF token verification
          const { validateCsrfToken } = await import("@/lib/csrf-verify.server");
          validateCsrfToken(csrfToken);

          const isAdmin = user.role === "admin" || user.role === "super_admin";

          // 4. Initiate payment via payment engine
          const result = await PaymentService.initiateNcbaPayment({
            orderId,
            userId: user.id,
            phone,
            isAdmin,
          });

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          console.error("[REST API NCBA STK ERROR]:", err);
          return new Response(
            JSON.stringify({
              success: false,
              error: err.message || "Failed to process NCBA STK push request.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
