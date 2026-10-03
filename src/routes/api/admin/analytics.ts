import { createFileRoute } from "@tanstack/react-router";
import { db, getDb } from "@/lib/db.server";
import { users } from "@/db/schema/users";
import { profiles } from "@/db/schema/profiles";
import { orders } from "@/db/schema/orders";
import { products } from "@/db/schema/products";
import { serviceRequests } from "@/db/schema/services";
import { count, eq, sql, desc, or, and } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";

function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "Recently";
  const now = Date.now();
  const time = new Date(date).getTime();
  const diffSec = Math.floor((now - time) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mins ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const Route = createFileRoute("/api/admin/analytics")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          // Gating filter: Admin only records and analyses confirmed paid orders OR WhatsApp orders
          const confirmedOrderFilter = or(
            eq(orders.paymentStatus, "paid"),
            eq(orders.checkoutChannel, "whatsapp")
          );

          const sqlClient = getDb();

          // Execute all independent analytics queries concurrently via Promise.all
          const [
            [orderStats],
            [customerCountRes],
            [farmersCountRes],
            [productsCountRes],
            [pendingServicesRes],
            monthlyRaw,
            weeklyRaw,
            auditRows,
            newsRows,
            serviceRows,
            orderRows,
          ] = await Promise.all([
            // 1. Single-pass aggregated order metrics
            sqlClient`
              SELECT 
                COUNT(*)::int AS "totalOrdersCount",
                COALESCE(SUM(CAST(total AS NUMERIC)), 0)::numeric AS "totalRevenue",
                COUNT(*) FILTER (WHERE status = 'delivered')::int AS "deliveredCount",
                COUNT(*) FILTER (WHERE status = 'shipped')::int AS "shippedCount",
                COUNT(*) FILTER (WHERE status = 'pending')::int AS "pendingCount",
                COUNT(*) FILTER (WHERE status = 'processing')::int AS "processingCount",
                COUNT(*) FILTER (WHERE status = 'cancelled')::int AS "cancelledCount"
              FROM orders
              WHERE (payment_status = 'paid' OR checkout_channel = 'whatsapp')
            `,

            // 2. Accurate Customer counts
            sqlClient`
              SELECT COUNT(DISTINCT LOWER(email))::int AS count
              FROM (
                SELECT email FROM users WHERE deleted_at IS NULL
                UNION
                SELECT email FROM profiles 
                WHERE deleted_at IS NULL 
                  AND role::text NOT IN ('admin', 'super_admin', 'sales_agent', 'content_editor')
              ) customer_identities
            `,

            // 3. Accurate Farmer counts
            sqlClient`
              SELECT COUNT(DISTINCT LOWER(email))::int AS count
              FROM (
                SELECT email FROM users 
                WHERE deleted_at IS NULL 
                  AND (farming_type IS NULL OR farming_type != 'I''m a Buyer/Consumer Only (no farming)')
                UNION
                SELECT email FROM profiles 
                WHERE deleted_at IS NULL 
                  AND role::text = 'farmer'
              ) farmer_identities
            `,

            // 4. Products count
            sqlClient`
              SELECT COUNT(*)::int AS count 
              FROM products 
              WHERE deleted_at IS NULL
            `,

            // 5. Pending service requests count
            sqlClient`
              SELECT COUNT(*)::int AS count 
              FROM service_requests 
              WHERE status = 'requested'
            `,

            // 6. Monthly Gross Revenue Trend
            sqlClient`
              SELECT 
                TO_CHAR(created_at, 'Mon') AS "monthLabel",
                EXTRACT(MONTH FROM created_at)::int AS "monthNum",
                COALESCE(SUM(CAST(total AS NUMERIC)), 0)::numeric AS revenue
              FROM orders
              WHERE (payment_status = 'paid' OR checkout_channel = 'whatsapp')
              GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
              ORDER BY "monthNum" ASC
            `,

            // 7. Weekly Order Volume
            sqlClient`
              SELECT 
                EXTRACT(DOW FROM created_at)::int AS dow,
                COUNT(*)::int AS "orderCount"
              FROM orders
              WHERE (payment_status = 'paid' OR checkout_channel = 'whatsapp')
              GROUP BY EXTRACT(DOW FROM created_at)
              ORDER BY dow ASC
            `,

            // 8. Audit logs
            sqlClient`
              SELECT 
                l.id, l.action, l.entity_type AS "entityType", l.entity_id AS "entityId", 
                l.diff, l.created_at AS "createdAt",
                p.full_name AS "fullName", p.email, p.role
              FROM admin_audit_logs l
              LEFT JOIN profiles p ON l.actor_id = p.id
              ORDER BY l.created_at DESC
              LIMIT 15
            `,

            // 9. Published news updates
            sqlClient`
              SELECT id, title, category, source_attribution AS "sourceAttribution", 
                     published_at AS "publishedAt", created_at AS "createdAt"
              FROM agritech_news
              WHERE LOWER(status) = 'published'
              ORDER BY COALESCE(published_at, created_at) DESC
              LIMIT 5
            `,

            // 10. Service inquiries
            sqlClient`
              SELECT 
                sr.id, sr.status, sr.contact_name AS "contactName", sr.location, 
                sr.subservice_name AS "subserviceName", sr.created_at AS "createdAt",
                s.name AS "serviceName"
              FROM service_requests sr
              LEFT JOIN services s ON sr.service_id = s.id
              ORDER BY sr.created_at DESC
              LIMIT 5
            `,

            // 11. Recent orders
            sqlClient`
              SELECT 
                o.id, o.total, o.payment_method AS "paymentMethod", 
                o.payment_status AS "paymentStatus", o.checkout_channel AS "checkoutChannel",
                o.created_at AS "createdAt",
                p.full_name AS "customerName", p.email AS "customerEmail"
              FROM orders o
              LEFT JOIN profiles p ON o.user_id = p.id
              ORDER BY o.created_at DESC
              LIMIT 10
            `,
          ]);

          const totalCustomersCount = customerCountRes?.count ?? 0;
          const totalFarmersCount = farmersCountRes?.count ?? totalCustomersCount;
          const totalOrdersCount = orderStats?.totalOrdersCount ?? 0;
          const fulfilledCount = (orderStats?.deliveredCount ?? 0) + (orderStats?.shippedCount ?? 0);
          const pendingCount = (orderStats?.pendingCount ?? 0) + (orderStats?.processingCount ?? 0);
          const cancelledCount = orderStats?.cancelledCount ?? 0;
          const fulfilledPct = totalOrdersCount > 0 ? Math.round((fulfilledCount / totalOrdersCount) * 100) : 0;

          const monthlyTrend = (monthlyRaw || []).map((m: any) => ({
            month: m.monthLabel,
            revenue: Number(m.revenue) || 0,
          }));

          const dowMap: Record<number, string> = {
            1: "Mon",
            2: "Tue",
            3: "Wed",
            4: "Thu",
            5: "Fri",
            6: "Sat",
            0: "Sun",
          };

          const daysOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          const weeklyVolume = daysOrder.map((day) => {
            const found = (weeklyRaw || []).find((w: any) => dowMap[Number(w.dow)] === day);
            return {
              day,
              count: found ? Number(found.orderCount) : 0,
            };
          });

          const activities: Array<{
            id: string;
            type: string;
            title: string;
            subtitle: string;
            time: string;
            category: string;
            badgeBg: string;
            timestamp: number;
            paymentStatus?: string;
            statusReason?: string;
            rawTimestamp?: string;
          }> = [];

          // Map real audit logs
          for (const a of auditRows) {
            const date = a.createdAt;
            const diff = (typeof a.diff === "string" ? JSON.parse(a.diff) : a.diff) || {};
            const actorName = a.fullName || a.email || "Platform User";

            let type = "Admin Audit";
            let title = `System Action: ${a.action}`;
            let subtitle = `Executed by ${actorName}`;
            let category = "Security";
            let badgeBg = "bg-[#0284C7]"; // Blue badge
            let paymentStatus = "info";
            let statusReason = "System event recorded";

            if (a.action === "order.created") {
              type = "Order Created";
              const orderNum = a.entityId ? `#${String(a.entityId).slice(0, 8).toUpperCase()}` : "Marketplace Order";
              title = `${orderNum} Placed by ${actorName}`;
              const total = diff.total ? `Total: KSh ${Number(diff.total).toLocaleString()} • ` : "";
              const payment = diff.paymentMethod ? `via ${String(diff.paymentMethod).toUpperCase()}` : "Checkout initiated";
              subtitle = `${total}${payment}`;
              category = "Commerce";
              badgeBg = "bg-[#EA580C]"; // Orange badge
              // Derive payment status from diff data
              const pStatus = String(diff.paymentStatus || diff.status || "pending").toLowerCase();
              if (pStatus === "paid" || pStatus === "success" || pStatus === "completed") {
                paymentStatus = "success";
                statusReason = `Payment received via ${String(diff.paymentMethod || "card").toUpperCase()} — order confirmed`;
              } else if (pStatus === "failed" || pStatus === "declined" || pStatus === "rejected") {
                paymentStatus = "failed";
                statusReason = diff.failureReason || diff.error || `Payment declined by ${String(diff.paymentMethod || "processor").toUpperCase()} — insufficient funds or card error`;
              } else {
                paymentStatus = "pending";
                statusReason = `Awaiting payment confirmation via ${String(diff.paymentMethod || "checkout").toUpperCase()}`;
              }
            } else if (a.action === "auth.login") {
              type = "User Login";
              title = `User Authentication: ${actorName}`;
              subtitle = `Signed in with role: ${diff.role || a.role || "farmer"}`;
              category = "Auth";
              badgeBg = "bg-[#0D9488]"; // Teal badge
              paymentStatus = "success";
              statusReason = `Authenticated successfully as ${diff.role || a.role || "farmer"}`;
            } else if (a.action === "auth.register") {
              type = "Farmer Onboarding";
              title = `New Farmer Registration: ${actorName}`;
              subtitle = "Created a new farm account on Mqulima Platform";
              category = "CRM";
              badgeBg = "bg-[#16A34A]"; // Green badge
              paymentStatus = "success";
              statusReason = "New farmer account created and verified";
            } else if (a.action === "DELETE_CUSTOMER") {
              type = "Account Moderation";
              title = "Farmer Account Record Removed";
              subtitle = `Profile ID ${String(a.entityId || "").slice(0, 8)} deleted by administrator`;
              category = "CRM";
              badgeBg = "bg-[#475569]"; // Slate badge
              paymentStatus = "warning";
              statusReason = `Account permanently removed by admin ${actorName}`;
            } else if (String(a.action).startsWith("ORDER_STATUS_")) {
              type = "Order Fulfillment";
              const statusName = String(a.action).replace("ORDER_STATUS_", "");
              title = `Order #${String(a.entityId || "").slice(0, 8).toUpperCase()} Marked as ${statusName}`;
              subtitle = `Fulfillment status transition performed by ${actorName}`;
              category = "Logistics";
              badgeBg = "bg-[#2563EB]"; // Royal blue
              const sName = statusName.toLowerCase();
              if (sName === "fulfilled" || sName === "delivered" || sName === "completed") {
                paymentStatus = "success";
                statusReason = `Order fulfilled and marked as ${statusName} by ${actorName}`;
              } else if (sName === "cancelled" || sName === "refunded" || sName === "returned") {
                paymentStatus = "failed";
                statusReason = `Order ${statusName.toLowerCase()} — ${diff.reason || "cancelled by admin or customer request"}`;
              } else {
                paymentStatus = "pending";
                statusReason = `Order status changed to ${statusName} — processing`;
              }
            }

            activities.push({
              id: `audit-${a.id}`,
              type,
              title,
              subtitle,
              time: formatRelativeTime(date),
              category,
              badgeBg,
              timestamp: new Date(date).getTime(),
              paymentStatus,
              statusReason,
              rawTimestamp: new Date(date).toISOString(),
            });
          }

          // Map real agritech news publications
          for (const n of newsRows) {
            const date = n.publishedAt || n.createdAt;
            const shortTitle = n.title.length > 55 ? n.title.slice(0, 52) + "..." : n.title;
            activities.push({
              id: `news-${n.id}`,
              type: "Agritech News",
              title: `Article Published: "${shortTitle}"`,
              subtitle: `Category: ${n.category} • Attribution: ${n.sourceAttribution || "Mqulima Editorial Desk"}`,
              paymentStatus: "info",
              statusReason: "Article published to news feed successfully",
              rawTimestamp: new Date(date).toISOString(),
              time: formatRelativeTime(date),
              category: "Market Intel",
              badgeBg: "bg-[#059669]", // Emerald badge
              timestamp: new Date(date).getTime(),
            });
          }

          // Map real service inquiries
          for (const s of serviceRows) {
            const date = s.createdAt;
            const svcStatus = String(s.status || "pending").toLowerCase();
            let svcPaymentStatus = "pending";
            let svcStatusReason = `Service request awaiting review`;
            if (svcStatus === "completed" || svcStatus === "resolved") {
              svcPaymentStatus = "success";
              svcStatusReason = "Service request completed successfully";
            } else if (svcStatus === "cancelled" || svcStatus === "rejected") {
              svcPaymentStatus = "failed";
              svcStatusReason = `Service request ${svcStatus} — ${s.rejectionReason || "no available agronomist"}`;
            } else if (svcStatus === "in_progress" || svcStatus === "assigned") {
              svcPaymentStatus = "pending";
              svcStatusReason = `Service currently ${svcStatus.replace("_", " ")} — agronomist assigned`;
            }
            activities.push({
              id: `service-${s.id}`,
              type: "Service Request",
              title: `Agronomy Request: ${s.serviceName || s.subserviceName || "Field Consultation"}`,
              subtitle: `Farmer: ${s.contactName || "Direct Request"} • Region: ${s.location || "Kenya"} • Status: ${String(s.status).toUpperCase()}`,
              time: formatRelativeTime(date),
              category: "Agronomy",
              badgeBg: "bg-[#4F46E5]", // Indigo badge
              timestamp: new Date(date).getTime(),
              paymentStatus: svcPaymentStatus,
              statusReason: svcStatusReason,
              rawTimestamp: new Date(date).toISOString(),
            });
          }

          // Merge recent orders that might not have duplicate audit IDs
          const existingOrderIds = new Set(
            auditRows.filter((a) => a.action === "order.created").map((a) => a.entityId)
          );

          for (const o of orderRows) {
            if (!existingOrderIds.has(o.id)) {
              const date = o.createdAt;
              const customer = o.customerName || o.customerEmail || "Farmer";
              const oPStatus = String(o.paymentStatus || "pending").toLowerCase();
              let oPaymentStatus = "pending";
              let oStatusReason = `Awaiting payment confirmation`;
              if (oPStatus === "paid" || oPStatus === "success" || oPStatus === "completed") {
                oPaymentStatus = "success";
                oStatusReason = `Payment of KSh ${Number(o.total || 0).toLocaleString()} received successfully`;
              } else if (oPStatus === "failed" || oPStatus === "declined" || oPStatus === "rejected") {
                oPaymentStatus = "failed";
                oStatusReason = o.failureReason || `Payment declined — ${String(o.checkoutChannel || "processor").toUpperCase()} transaction error`;
              }
              activities.push({
                id: `order-${o.id}`,
                type: "Order Purchase",
                title: `Order #${String(o.id).slice(0, 8).toUpperCase()} Placed`,
                subtitle: `Customer: ${customer} • Total: KSh ${Number(o.total || 0).toLocaleString()} • ${String(o.checkoutChannel || "web").toUpperCase()} (${String(o.paymentStatus || "pending").toUpperCase()})`,
                time: formatRelativeTime(date),
                category: "Commerce",
                badgeBg: "bg-[#EA580C]",
                timestamp: new Date(date).getTime(),
                paymentStatus: oPaymentStatus,
                statusReason: oStatusReason,
                rawTimestamp: new Date(date).toISOString(),
              });
            }
          }

          // Sort strictly by timestamp descending (newest live event first)
          activities.sort((x, y) => y.timestamp - x.timestamp);

          const liveActivities = activities.slice(0, 10);

          return new Response(
            JSON.stringify({
              success: true,
              kpis: {
                activeCustomers: totalCustomersCount,
                totalFarmers: totalFarmersCount,
                openOrders: totalOrdersCount,
                totalProducts: productsCountRes?.count || 0,
                pendingServices: pendingServicesRes?.count || 0,
                totalRevenueKsh: Number(orderStats?.totalRevenue) || 0,
                fulfilledCount,
                pendingCount,
                cancelledCount,
                fulfilledPct,
                monthlyTrend,
                weeklyVolume,
              },
              liveActivities,
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                Pragma: "no-cache",
              },
            }
          );
        } catch (error: any) {
          console.error("Admin analytics fetch error:", error);
          return new Response(
            JSON.stringify({
              success: false,
              error: error.message || "Failed to fetch analytics",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
