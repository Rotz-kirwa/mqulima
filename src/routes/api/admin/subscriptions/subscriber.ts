import { createFileRoute } from "@tanstack/react-router";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";
import { getSubscriberProfile } from "@/lib/services/subscriptions.server";

export const Route = createFileRoute("/api/admin/subscriptions/subscriber")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const auth = await requireAdminAuth(request, "subscriptions.read");
        if ("response" in auth) return auth.response;

        try {
          const url = new URL(request.url);
          const email = url.searchParams.get("email");

          if (!email) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "email parameter is required",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const profile = await getSubscriberProfile(email);

          return new Response(
            JSON.stringify({
              success: true,
              profile,
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
          console.error("[API /api/admin/subscriptions/subscriber] Error:", error);
          return new Response(
            JSON.stringify({
              success: false,
              error: error.message || "Failed to load subscriber profile",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
