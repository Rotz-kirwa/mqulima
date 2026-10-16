import { createFileRoute } from "@tanstack/react-router";
import { getCurrentUser } from "@/lib/auth-server";
import { recordSubscription, updateSubscriptionStatus } from "@/lib/services/subscriptions.server";
import { getDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/user/subscriptions")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const user = await getCurrentUser().catch(() => null);
          const url = new URL(request.url);
          const emailParam = url.searchParams.get("email");
          const targetEmail = user?.email || emailParam;

          if (!targetEmail) {
            return new Response(
              JSON.stringify({
                success: true,
                subscriptions: [],
                channels: { market: false, sowing: false, weather: false, news: false },
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          const sql = getDb();
          const subs = await sql`
            SELECT id, category, service_name, status, subscription_type, created_at, started_at
            FROM subscriptions
            WHERE LOWER(email) = ${targetEmail.toLowerCase().trim()}
            ORDER BY created_at DESC
          `;

          const activeSubs = subs.filter((s: any) => s.status === "active");
          const hasMarket = activeSubs.some((s: any) => s.category === "market_alerts");
          const hasWeather = activeSubs.some((s: any) => s.category === "weather_alerts");
          const hasNews = activeSubs.some((s: any) => s.category === "news");

          return new Response(
            JSON.stringify({
              success: true,
              subscriptions: subs,
              channels: {
                market: hasMarket,
                sowing: hasWeather,
                weather: hasWeather,
                news: hasNews,
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
            }
          );
        } catch (error: any) {
          console.error("[API /api/user/subscriptions GET] Error:", error);
          return new Response(
            JSON.stringify({ success: false, error: error.message || "Failed to fetch user subscriptions" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },

      POST: async ({ request }: { request: Request }) => {
        try {
          const user = await getCurrentUser().catch(() => null);
          const body = await request.json().catch(() => ({}));
          const targetEmail = user?.email || body.email;

          if (!targetEmail) {
            return new Response(
              JSON.stringify({ success: false, error: "Authentication or email required" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const channel = body.channel as "market" | "weather" | "sowing" | "news" | "ai" | "community";
          const enabled = Boolean(body.enabled);
          const sql = getDb();

          let category = "other";
          let serviceName = "Mqulima Service";

          if (channel === "market") {
            category = "market_alerts";
            serviceName = "KAMIS Daily Commodity Price Alerts & Market Updates";
          } else if (channel === "weather" || channel === "sowing") {
            category = "weather_alerts";
            serviceName = "County Sowing Windows & Agro-Weather Forecast Radar";
          } else if (channel === "news") {
            category = "news";
            serviceName = "Weekly Agritech Digest & Intelligence Bulletin";
          } else if (channel === "ai") {
            category = "ai_services";
            serviceName = "Mqulima AI Crop Doctor & Agronomy Consultations";
          } else if (channel === "community") {
            category = "community";
            serviceName = "Mqulima Farmer Circle Community & Advisory";
          }

          const normalizedEmail = targetEmail.toLowerCase().trim();

          if (enabled) {
            await recordSubscription({
              userId: user?.id || null,
              email: normalizedEmail,
              fullName: (user as any)?.name || (user as any)?.fullName || null,
              phone: (user as any)?.phone || null,
              category: category as any,
              serviceName,
              planCode: `${category}_free`,
              subscriptionType: "free",
              status: "active",
              billingCycle: "none",
              priceKes: 0,
              paymentStatus: "waived",
              actorType: user ? "user" : "system",
              actorEmail: normalizedEmail,
              notes: `User ${enabled ? "enabled" : "disabled"} ${channel} alert subscription from dashboard`,
            });
          } else {
            // Find active subscription and mark unsubscribed
            const [existing] = await sql`
              SELECT id FROM subscriptions
              WHERE LOWER(email) = ${normalizedEmail}
                AND category = ${category}
                AND service_name = ${serviceName}
              LIMIT 1
            `;
            if (existing) {
              await updateSubscriptionStatus(
                existing.id,
                "unsubscribed",
                normalizedEmail,
                `User turned off ${channel} alert channel`
              );
            }
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: `${channel.charAt(0).toUpperCase() + channel.slice(1)} alerts ${enabled ? "enabled" : "disabled"} successfully`,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (error: any) {
          console.error("[API /api/user/subscriptions POST] Error:", error);
          return new Response(
            JSON.stringify({ success: false, error: error.message || "Failed to update alert channel" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
