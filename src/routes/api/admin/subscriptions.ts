import { createFileRoute } from "@tanstack/react-router";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";
import { logAdminAction } from "@/lib/audit.server";
import {
  getSubscriptionsList,
  recordSubscription,
  updateSubscriptionStatus,
  type SubscriptionCategory,
  type SubscriptionStatus,
} from "@/lib/services/subscriptions.server";
import { getDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/admin/subscriptions")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const auth = await requireAdminAuth(request, "subscriptions.read");
        if ("response" in auth) return auth.response;

        try {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get("page") || "1", 10);
          const limit = parseInt(url.searchParams.get("limit") || "20", 10);
          const search = url.searchParams.get("search") || undefined;
          const category = url.searchParams.get("category") || undefined;
          const status = url.searchParams.get("status") || undefined;
          const paymentStatus = url.searchParams.get("paymentStatus") || undefined;
          const sortBy = (url.searchParams.get("sortBy") as any) || "started_at";
          const sortOrder = (url.searchParams.get("sortOrder") as any) || "desc";
          const startDate = url.searchParams.get("startDate") || undefined;
          const endDate = url.searchParams.get("endDate") || undefined;

          const result = await getSubscriptionsList({
            page,
            limit,
            search,
            category,
            status,
            paymentStatus,
            sortBy,
            sortOrder,
            startDate,
            endDate,
          });

          return new Response(
            JSON.stringify({
              success: true,
              ...result,
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
          console.error("[API /api/admin/subscriptions GET] Error:", error);
          return new Response(
            JSON.stringify({
              success: false,
              error: error.message || "Failed to load subscriptions",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },

      POST: async ({ request }: { request: Request }) => {
        const auth = await requireAdminAuth(request, "subscriptions.write");
        if ("response" in auth) return auth.response;

        try {
          const body = await request.json().catch(() => ({}));
          const action = body.action || "create";
          const adminEmail = auth.user?.email || "admin@mqulima.com";

          if (action === "update_status") {
            const { id, status, notes } = body;
            if (!id || !status) {
              return new Response(
                JSON.stringify({ success: false, error: "Missing subscription ID or status" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }

            const updated = await updateSubscriptionStatus(
              id,
              status as SubscriptionStatus,
              adminEmail,
              notes
            );

            await logAdminAction({
              actorId: auth.user?.id || "admin",
              action: `subscription.${status}`,
              entityType: "subscription",
              entityId: id,
              diff: { previousStatus: body.previousStatus, newStatus: status, notes },
            }).catch(() => {});

            return new Response(
              JSON.stringify({
                success: true,
                message: `Subscription status updated to ${status}`,
                subscription: updated,
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          if (action === "renew") {
            const { id, expiresAt, notes } = body;
            if (!id) {
              return new Response(
                JSON.stringify({ success: false, error: "Missing subscription ID" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }

            const sql = getDb();
            const [sub] = await sql`SELECT * FROM subscriptions WHERE id = ${id}`;
            if (!sub) {
              return new Response(
                JSON.stringify({ success: false, error: "Subscription not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
              );
            }

            const newExpiry = expiresAt
              ? new Date(expiresAt)
              : sub.billing_cycle === "annual"
              ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            await sql`
              UPDATE subscriptions SET
                status = 'active',
                expires_at = ${newExpiry},
                cancelled_at = NULL,
                updated_at = NOW()
              WHERE id = ${id}
            `;

            await sql`
              INSERT INTO subscription_events (
                subscription_id,
                event_type,
                actor_type,
                actor_email,
                previous_status,
                new_status,
                notes
              ) VALUES (
                ${id},
                'renewed',
                'admin',
                ${adminEmail},
                ${sub.status},
                'active',
                ${notes || `Subscription renewed until ${newExpiry.toISOString()}`}
              )
            `;

            const [renewed] = await sql`SELECT * FROM subscriptions WHERE id = ${id}`;

            return new Response(
              JSON.stringify({
                success: true,
                message: "Subscription successfully renewed",
                subscription: renewed,
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          if (action === "update") {
            const { id, planCode, priceKes, billingCycle, paymentStatus, expiresAt, serviceName } = body;
            if (!id) {
              return new Response(
                JSON.stringify({ success: false, error: "Missing subscription ID" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }

            const sql = getDb();
            await sql`
              UPDATE subscriptions SET
                plan_code = COALESCE(${planCode || null}, plan_code),
                price_kes = COALESCE(${priceKes !== undefined ? Number(priceKes) : null}, price_kes),
                billing_cycle = COALESCE(${billingCycle || null}, billing_cycle),
                payment_status = COALESCE(${paymentStatus || null}, payment_status),
                expires_at = ${expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : sql`expires_at`},
                service_name = COALESCE(${serviceName || null}, service_name),
                updated_at = NOW()
              WHERE id = ${id}
            `;

            const [updated] = await sql`SELECT * FROM subscriptions WHERE id = ${id}`;

            return new Response(
              JSON.stringify({
                success: true,
                message: "Subscription details updated",
                subscription: updated,
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          // Default: Create/Enroll new subscriber
          const {
            email,
            fullName,
            phone,
            category,
            serviceName,
            planCode,
            subscriptionType,
            status,
            billingCycle,
            priceKes,
            paymentStatus,
            expiresAt,
            notes,
          } = body;

          if (!email || !category || !serviceName) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "email, category, and serviceName are required fields",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const subscription = await recordSubscription({
            email,
            fullName,
            phone,
            category: category as SubscriptionCategory,
            serviceName,
            planCode: planCode || "standard",
            subscriptionType: subscriptionType || (Number(priceKes || 0) > 0 ? "paid_recurring" : "free"),
            status: (status as SubscriptionStatus) || "active",
            billingCycle: billingCycle || (Number(priceKes || 0) > 0 ? "monthly" : "none"),
            priceKes: Number(priceKes || 0),
            paymentStatus: paymentStatus || (Number(priceKes || 0) > 0 ? "paid" : "waived"),
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            actorType: "admin",
            actorEmail: adminEmail,
            notes: notes || "Enrolled manually via Admin Console",
          });

          await logAdminAction({
            actorId: auth.user?.id || "admin",
            action: "subscription.create",
            entityType: "subscription",
            entityId: subscription.id,
            diff: { email, category, serviceName, priceKes },
          }).catch(() => {});

          return new Response(
            JSON.stringify({
              success: true,
              message: "Subscription successfully created",
              subscription,
            }),
            { status: 201, headers: { "Content-Type": "application/json" } }
          );
        } catch (error: any) {
          console.error("[API /api/admin/subscriptions POST] Error:", error);
          return new Response(
            JSON.stringify({
              success: false,
              error: error.message || "Failed to process subscription action",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
