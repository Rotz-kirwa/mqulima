import { createFileRoute } from "@tanstack/react-router";
import { PaymentService } from "@/lib/payments/services/payment.service";

export const Route = createFileRoute("/api/payments/status")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
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

          const url = new URL(request.url);
          const orderId = url.searchParams.get("orderId");

          if (!orderId) {
            return new Response(
              JSON.stringify({ success: false, error: "Query parameter 'orderId' is required." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const isAdmin = user.role === "admin" || user.role === "super_admin";

          // 2. Fetch payment status with ownership authorization check
          const status = await PaymentService.getPaymentStatus(orderId, user.id, isAdmin);

          if (!status) {
            return new Response(
              JSON.stringify({
                success: true,
                status: "pending",
                receiptNumber: null,
                resultDescription: "No payment record initiated yet.",
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          return new Response(
            JSON.stringify({
              success: true,
              status: status.status,
              provider: status.provider,
              receiptNumber: status.receiptNumber,
              resultDescription: status.resultDescription,
              amount: status.amount,
              currency: status.currency,
              completedAt: status.completedAt,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (err: any) {
          console.error("[REST API PAYMENT STATUS ERROR]:", err);
          return new Response(
            JSON.stringify({ success: false, error: err.message || "Failed to retrieve payment status." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
