import { createFileRoute } from "@tanstack/react-router";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";
import {
  fetchGA4AnalyticsReport,
  getGA4ConfigStatus,
  type DateRangePreset,
  type DateRangeQuery,
} from "@/lib/server/ga4-reporting.server";

export const Route = createFileRoute("/api/admin/visitor-analytics")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Enforce strict administrative authentication and "analytics.read" RBAC permission
        const auth = await requireAdminAuth(request, "analytics.read");
        if ("response" in auth) {
          return auth.response;
        }

        try {
          const url = new URL(request.url);
          const rawPreset = url.searchParams.get("preset") || "28d";
          const validPresets: DateRangePreset[] = ["today", "7d", "28d", "30d", "90d", "custom"];
          const preset: DateRangePreset = validPresets.includes(rawPreset as DateRangePreset)
            ? (rawPreset as DateRangePreset)
            : "28d";

          const startDate = url.searchParams.get("startDate") || undefined;
          const endDate = url.searchParams.get("endDate") || undefined;
          const forceRefresh =
            url.searchParams.get("refresh") === "true" ||
            request.headers.get("x-bypass-cache") === "true";

          // Validate date strings if preset is custom
          if (preset === "custom") {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!startDate || !endDate || !dateRegex.test(startDate) || !dateRegex.test(endDate)) {
              return new Response(
                JSON.stringify({
                  success: false,
                  error: "Invalid custom date range. Both startDate and endDate must be in YYYY-MM-DD format.",
                }),
                {
                  status: 400,
                  headers: { "Content-Type": "application/json" },
                }
              );
            }
          }

          const query: DateRangeQuery = {
            preset,
            startDate,
            endDate,
          };

          const configStatus = getGA4ConfigStatus();
          const report = await fetchGA4AnalyticsReport(query, forceRefresh);

          return new Response(
            JSON.stringify({
              success: true,
              configStatus,
              report,
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
          console.error("[API Admin Visitor Analytics Error]:", error);
          return new Response(
            JSON.stringify({
              success: false,
              error: error?.message || "An unexpected error occurred while generating analytics report.",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
