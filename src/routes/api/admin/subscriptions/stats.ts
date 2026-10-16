import { createFileRoute } from "@tanstack/react-router";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";
import { getSubscriptionStats } from "@/lib/services/subscriptions.server";

export const Route = createFileRoute("/api/admin/subscriptions/stats")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const auth = await requireAdminAuth(request, "subscriptions.read");
        if ("response" in auth) return auth.response;

        try {
          const stats = await getSubscriptionStats();
          return new Response(
            JSON.stringify({
              success: true,
              stats,
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "private, no-cache, no-store, must-revalidate",
              },
            }
          );
        } catch (error: any) {
          console.error("[API /api/admin/subscriptions/stats] Error:", error);
          return new Response(
            JSON.stringify({
              success: false,
              error: error.message || "Failed to load subscription statistics",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
