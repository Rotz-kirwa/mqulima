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

          // 1. Ensure baseline users & products exist
          const userList = await db.select().from(users).limit(5);
          const productList = await db.select().from(products).limit(5);

          const [totalOrdersRes] = await db
            .select({ count: count() })
            .from(orders)
            .where(confirmedOrderFilter);

          const [totalUsersRes] = await db.select({ count: count() }).from(users);
          const [totalProfilesRes] = await db.select({ count: count() }).from(profiles);
          const [totalFarmersRes] = await db
            .select({ count: count() })
            .from(profiles)
            .where(eq(profiles.role, "farmer"));

          const [totalProductsRes] = await db.select({ count: count() }).from(products);
          const [pendingServicesRes] = await db
            .select({ count: count() })
            .from(serviceRequests)
            .where(eq(serviceRequests.status, "requested"));

          const revenueRes = await db
            .select({
              totalRevenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS NUMERIC)), 0)`,
            })
            .from(orders)
            .where(confirmedOrderFilter);

          // Real Order Breakdown by status from PostgreSQL for confirmed orders
          const [fulfilledRes] = await db
            .select({ count: count() })
            .from(orders)
            .where(and(eq(orders.status, "delivered"), confirmedOrderFilter));
          const [shippedRes] = await db
            .select({ count: count() })
            .from(orders)
            .where(and(eq(orders.status, "shipped"), confirmedOrderFilter));
          const [pendingRes] = await db
            .select({ count: count() })
            .from(orders)
            .where(and(eq(orders.status, "pending"), confirmedOrderFilter));
          const [processingRes] = await db
            .select({ count: count() })
            .from(orders)
            .where(and(eq(orders.status, "processing"), confirmedOrderFilter));
          const [cancelledRes] = await db
            .select({ count: count() })
            .from(orders)
            .where(and(eq(orders.status, "cancelled"), confirmedOrderFilter));

          const totalOrdersCount = totalOrdersRes?.count || 0;
          const fulfilledCount = (fulfilledRes?.count || 0) + (shippedRes?.count || 0);
          const pendingCount = (pendingRes?.count || 0) + (processingRes?.count || 0);
          const cancelledCount = cancelledRes?.count || 0;
          const fulfilledPct = totalOrdersCount > 0 ? Math.round((fulfilledCount / totalOrdersCount) * 100) : 0;

          // Real Monthly Gross Revenue Trend SQL Query
          const monthlyRaw = await db
            .select({
              monthLabel: sql<string>`TO_CHAR(${orders.createdAt}, 'Mon')`,
              monthNum: sql<number>`EXTRACT(MONTH FROM ${orders.createdAt})`,
              revenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS NUMERIC)), 0)`,
            })
            .from(orders)
            .where(confirmedOrderFilter)
            .groupBy(sql`TO_CHAR(${orders.createdAt}, 'Mon')`, sql`EXTRACT(MONTH FROM ${orders.createdAt})`)
            .orderBy(sql`EXTRACT(MONTH FROM ${orders.createdAt})`);

          const monthlyTrend = monthlyRaw.map((m) => ({
            month: m.monthLabel,
            revenue: Number(m.revenue) || 0,
          }));

          // Real Weekly Order Volume SQL Query
          const weeklyRaw = await db
            .select({
              dow: sql<number>`EXTRACT(DOW FROM ${orders.createdAt})`,
              orderCount: count(),
            })
            .from(orders)
            .where(confirmedOrderFilter)
            .groupBy(sql`EXTRACT(DOW FROM ${orders.createdAt})`)
            .orderBy(sql`EXTRACT(DOW FROM ${orders.createdAt})`);

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
            const found = weeklyRaw.find((w) => dowMap[Number(w.dow)] === day);
            return {
              day,
              count: found ? Number(found.orderCount) : 0,
            };
          });

          // Fetch 100% Real Live Activities & Audit Feed from Database (Zero Mock Data)
          const sqlClient = getDb();

          // A. Real admin and user audit actions
          const auditRows = await sqlClient`
            SELECT 
              l.id, l.action, l.entity_type AS "entityType", l.entity_id AS "entityId", 
              l.diff, l.created_at AS "createdAt",
              p.full_name AS "fullName", p.email, p.role
            FROM admin_audit_logs l
            LEFT JOIN profiles p ON l.actor_id = p.id
            ORDER BY l.created_at DESC
            LIMIT 15
          `;

          // B. Real published news updates
          const newsRows = await sqlClient`
            SELECT id, title, category, source_attribution AS "sourceAttribution", 
                   published_at AS "publishedAt", created_at AS "createdAt"
            FROM agritech_news
            WHERE LOWER(status) = 'published'
            ORDER BY COALESCE(published_at, created_at) DESC
            LIMIT 5
          `;

          // C. Real service inquiries
          const serviceRows = await sqlClient`
            SELECT 
              sr.id, sr.status, sr.contact_name AS "contactName", sr.location, 
              sr.subservice_name AS "subserviceName", sr.created_at AS "createdAt",
              s.name AS "serviceName"
            FROM service_requests sr
            LEFT JOIN services s ON sr.service_id = s.id
            ORDER BY sr.created_at DESC
            LIMIT 5
          `;

          // D. Real recent orders
          const orderRows = await sqlClient`
            SELECT 
              o.id, o.total, o.payment_method AS "paymentMethod", 
              o.payment_status AS "paymentStatus", o.checkout_channel AS "checkoutChannel",
              o.created_at AS "createdAt",
              p.full_name AS "customerName", p.email AS "customerEmail"
            FROM orders o
            LEFT JOIN profiles p ON o.user_id = p.id
            ORDER BY o.created_at DESC
            LIMIT 10
          `;

          const activities: Array<{
            id: string;
            type: string;
            title: string;
            subtitle: string;
            time: string;
            category: string;
            badgeBg: string;
            timestamp: number;
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

            if (a.action === "order.created") {
              type = "Order Created";
              const orderNum = a.entityId ? `#${String(a.entityId).slice(0, 8).toUpperCase()}` : "Marketplace Order";
              title = `${orderNum} Placed by ${actorName}`;
              const total = diff.total ? `Total: KSh ${Number(diff.total).toLocaleString()} • ` : "";
              const payment = diff.paymentMethod ? `via ${String(diff.paymentMethod).toUpperCase()}` : "Checkout initiated";
              subtitle = `${total}${payment}`;
              category = "Commerce";
              badgeBg = "bg-[#EA580C]"; // Orange badge
            } else if (a.action === "auth.login") {
              type = "User Login";
              title = `User Authentication: ${actorName}`;
              subtitle = `Signed in with role: ${diff.role || a.role || "farmer"}`;
              category = "Auth";
              badgeBg = "bg-[#0D9488]"; // Teal badge
            } else if (a.action === "auth.register") {
              type = "Farmer Onboarding";
              title = `New Farmer Registration: ${actorName}`;
              subtitle = "Created a new farm account on Mqulima Platform";
              category = "CRM";
              badgeBg = "bg-[#16A34A]"; // Green badge
            } else if (a.action === "DELETE_CUSTOMER") {
              type = "Account Moderation";
              title = "Farmer Account Record Removed";
              subtitle = `Profile ID ${String(a.entityId || "").slice(0, 8)} deleted by administrator`;
              category = "CRM";
              badgeBg = "bg-[#475569]"; // Slate badge
            } else if (String(a.action).startsWith("ORDER_STATUS_")) {
              type = "Order Fulfillment";
              const statusName = String(a.action).replace("ORDER_STATUS_", "");
              title = `Order #${String(a.entityId || "").slice(0, 8).toUpperCase()} Marked as ${statusName}`;
              subtitle = `Fulfillment status transition performed by ${actorName}`;
              category = "Logistics";
              badgeBg = "bg-[#2563EB]"; // Royal blue
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
              time: formatRelativeTime(date),
              category: "Market Intel",
              badgeBg: "bg-[#059669]", // Emerald badge
              timestamp: new Date(date).getTime(),
            });
          }

          // Map real service inquiries
          for (const s of serviceRows) {
            const date = s.createdAt;
            activities.push({
              id: `service-${s.id}`,
              type: "Service Request",
              title: `Agronomy Request: ${s.serviceName || s.subserviceName || "Field Consultation"}`,
              subtitle: `Farmer: ${s.contactName || "Direct Request"} • Region: ${s.location || "Kenya"} • Status: ${String(s.status).toUpperCase()}`,
              time: formatRelativeTime(date),
              category: "Agronomy",
              badgeBg: "bg-[#4F46E5]", // Indigo badge
              timestamp: new Date(date).getTime(),
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
              activities.push({
                id: `order-${o.id}`,
                type: "Order Purchase",
                title: `Order #${String(o.id).slice(0, 8).toUpperCase()} Placed`,
                subtitle: `Customer: ${customer} • Total: KSh ${Number(o.total || 0).toLocaleString()} • ${String(o.checkoutChannel || "web").toUpperCase()} (${String(o.paymentStatus || "pending").toUpperCase()})`,
                time: formatRelativeTime(date),
                category: "Commerce",
                badgeBg: "bg-[#EA580C]",
                timestamp: new Date(date).getTime(),
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
                activeCustomers: totalProfilesRes?.count || totalUsersRes?.count || 0,
                totalFarmers: totalFarmersRes?.count || 0,
                openOrders: totalOrdersCount,
                totalProducts: totalProductsRes?.count || 0,
                pendingServices: pendingServicesRes?.count || 0,
                totalRevenueKsh: Number(revenueRes[0]?.totalRevenue) || 0,
                fulfilledCount,
                pendingCount,
                cancelledCount,
                fulfilledPct,
                monthlyTrend,
                weeklyVolume,
              },
              liveActivities,
            }),
            { headers: { "Content-Type": "application/json" } }
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
