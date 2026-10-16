import { createFileRoute } from "@tanstack/react-router";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";
import { getSubscriptionsList } from "@/lib/services/subscriptions.server";
import { logAdminAction } from "@/lib/audit.server";

export const Route = createFileRoute("/api/admin/subscriptions/export")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const auth = await requireAdminAuth(request, "subscriptions.export");
        if ("response" in auth) return auth.response;

        try {
          const url = new URL(request.url);
          const category = url.searchParams.get("category") || undefined;
          const status = url.searchParams.get("status") || undefined;
          const paymentStatus = url.searchParams.get("paymentStatus") || undefined;
          const search = url.searchParams.get("search") || undefined;

          // Fetch up to 10,000 rows for export
          const result = await getSubscriptionsList({
            page: 1,
            limit: 10000,
            category,
            status,
            paymentStatus,
            search,
            sortBy: "started_at",
            sortOrder: "desc",
          });

          // Log export action for audit compliance
          await logAdminAction({
            actorId: auth.user?.id || "admin",
            action: "subscriptions.export_csv",
            entityType: "subscriptions",
            entityId: "all",
            diff: { count: result.subscriptions.length, category, status },
          }).catch(() => {});

          const headers = [
            "Subscription ID",
            "Full Name",
            "Email Address",
            "Phone Number",
            "Category",
            "Service Name",
            "Plan Code",
            "Subscription Type",
            "Status",
            "Billing Cycle",
            "Price (KES)",
            "Currency",
            "Payment Status",
            "Payment Method",
            "Payment Reference",
            "Started Date",
            "Expiry Date",
            "Next Billing Date",
            "Cancelled Date",
            "County/Region",
          ];

          const csvEscape = (val: any) => {
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          };

          const rows = result.subscriptions.map((s: any) => [
            csvEscape(s.id),
            csvEscape(s.full_name || "N/A"),
            csvEscape(s.email),
            csvEscape(s.phone || "N/A"),
            csvEscape(s.category),
            csvEscape(s.service_name),
            csvEscape(s.plan_code),
            csvEscape(s.subscription_type),
            csvEscape(s.status),
            csvEscape(s.billing_cycle),
            csvEscape(s.price_kes),
            csvEscape(s.currency),
            csvEscape(s.payment_status),
            csvEscape(s.payment_method),
            csvEscape(s.payment_reference || "N/A"),
            csvEscape(s.started_at ? new Date(s.started_at).toISOString().split("T")[0] : "N/A"),
            csvEscape(s.expires_at ? new Date(s.expires_at).toISOString().split("T")[0] : "N/A"),
            csvEscape(s.next_billing_at ? new Date(s.next_billing_at).toISOString().split("T")[0] : "N/A"),
            csvEscape(s.cancelled_at ? new Date(s.cancelled_at).toISOString().split("T")[0] : "N/A"),
            csvEscape(s.user_county || "Kenya"),
          ]);

          const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\r\n");

          const filename = `mqulima_subscriptions_${category || "all"}_${new Date().toISOString().split("T")[0]}.csv`;

          return new Response(csvContent, {
            status: 200,
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition": `attachment; filename="${filename}"`,
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          });
        } catch (error: any) {
          console.error("[API /api/admin/subscriptions/export] Error:", error);
          return new Response("Failed to generate CSV export", { status: 500 });
        }
      },
    },
  },
});
