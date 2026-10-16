import fs from "fs";
import path from "path";

if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const parts = line.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

import { describe, it, expect, afterAll } from "vitest";
import { getDb } from "../src/lib/db.server";
import {
  recordSubscription,
  updateSubscriptionStatus,
  getSubscriptionsList,
  getSubscriptionStats,
  getSubscriberProfile,
} from "../src/lib/services/subscriptions.server";

describe("Centralized Subscription Management System", () => {
  const testEmail = `test_integration_${Date.now()}@mqulima.com`;
  const sql = getDb();
  let createdSubId: string;

  afterAll(async () => {
    // Clean up test data
    await sql`DELETE FROM subscriptions WHERE email = ${testEmail}`;
  });

  it("1. Automatically records an anonymous newsletter subscription under news category", async () => {
    const sub = await recordSubscription({
      email: testEmail,
      fullName: "Test Farmer",
      category: "news",
      serviceName: "Weekly Agritech Digest & Intelligence Bulletin",
      planCode: "newsletter_free",
      subscriptionType: "free",
      status: "active",
      billingCycle: "none",
      priceKes: 0,
      paymentStatus: "waived",
      actorType: "user",
      actorEmail: testEmail,
      notes: "Test newsletter subscription",
    });

    expect(sub).toBeDefined();
    expect(sub.id).toBeDefined();
    expect(sub.email).toBe(testEmail);
    expect(sub.category).toBe("news");
    expect(sub.status).toBe("active");
    createdSubId = sub.id;

    // Verify audit event was logged
    const events = await sql`
      SELECT * FROM subscription_events WHERE subscription_id = ${createdSubId}
    `;
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].event_type).toBe("created");
  });

  it("2. Automatically records an academy course subscription for the same user identity", async () => {
    const academySub = await recordSubscription({
      email: testEmail,
      fullName: "Test Farmer",
      category: "academy",
      serviceName: "Commercial Sukuma Wiki Masterclass",
      planCode: "course_sukuma_101",
      subscriptionType: "one_time",
      status: "active",
      billingCycle: "none",
      priceKes: 1200,
      paymentStatus: "paid",
      paymentMethod: "mpesa",
      paymentReference: "TESTMPESA123",
      actorType: "user",
      actorEmail: testEmail,
      notes: "Enrolled in academy course",
    });

    expect(academySub).toBeDefined();
    expect(academySub.category).toBe("academy");
    expect(academySub.email).toBe(testEmail);
    expect(Number(academySub.price_kes)).toBe(1200);
    expect(academySub.payment_status).toBe("paid");
  });

  it("3. Supports multiple subscriptions for one user across different categories", async () => {
    // Also subscribe to weather alerts
    await recordSubscription({
      email: testEmail,
      category: "weather_alerts",
      serviceName: "County Sowing Windows & Agro-Weather Radar",
      subscriptionType: "free",
      status: "active",
      actorType: "user",
    });

    // Also subscribe to market rates
    await recordSubscription({
      email: testEmail,
      category: "market_alerts",
      serviceName: "KAMIS Commodity Price Alerts",
      subscriptionType: "free",
      status: "active",
      actorType: "user",
    });

    const profile = await getSubscriberProfile(testEmail);
    expect(profile.email).toBe(testEmail);
    expect(profile.subscriptions.length).toBe(4); // news + academy + weather + market
    const categories = profile.subscriptions.map((s: any) => s.category);
    expect(categories).toContain("news");
    expect(categories).toContain("academy");
    expect(categories).toContain("weather_alerts");
    expect(categories).toContain("market_alerts");
  });

  it("4. Idempotently updates existing subscription on duplicate submission without creating duplicate rows", async () => {
    const beforeCount = await sql`
      SELECT COUNT(*)::int AS cnt FROM subscriptions WHERE email = ${testEmail} AND category = 'news'
    `;
    expect(beforeCount[0].cnt).toBe(1);

    // Re-subscribe to news
    const updated = await recordSubscription({
      email: testEmail,
      category: "news",
      serviceName: "Weekly Agritech Digest & Intelligence Bulletin",
      status: "active",
      notes: "User refreshed newsletter subscription",
    });

    const afterCount = await sql`
      SELECT COUNT(*)::int AS cnt FROM subscriptions WHERE email = ${testEmail} AND category = 'news'
    `;
    expect(afterCount[0].cnt).toBe(1);
    expect(updated.id).toBe(createdSubId);
  });

  it("5. Updates status correctly (unsubscribing updates single service without deleting others)", async () => {
    await updateSubscriptionStatus(createdSubId, "unsubscribed", "admin@mqulima.com", "User opted out of news");

    const [sub] = await sql`SELECT * FROM subscriptions WHERE id = ${createdSubId}`;
    expect(sub.status).toBe("unsubscribed");
    expect(sub.cancelled_at).not.toBeNull();

    // Verify other subscriptions for same user remain active
    const profile = await getSubscriberProfile(testEmail);
    const activeSubs = profile.subscriptions.filter((s: any) => s.status === "active");
    expect(activeSubs.length).toBe(3); // academy, weather, market are still active
  });

  it("6. getSubscriptionsList filters by category, status, and search query correctly", async () => {
    // Search by email
    const searchResult = await getSubscriptionsList({ search: testEmail });
    expect(searchResult.subscriptions.length).toBe(4);

    // Filter by academy category
    const academyResult = await getSubscriptionsList({ search: testEmail, category: "academy" });
    expect(academyResult.subscriptions.length).toBe(1);
    expect(academyResult.subscriptions[0].category).toBe("academy");

    // Filter by status unsubscribed
    const unsubsResult = await getSubscriptionsList({ search: testEmail, status: "unsubscribed" });
    expect(unsubsResult.subscriptions.length).toBe(1);
    expect(unsubsResult.subscriptions[0].id).toBe(createdSubId);
  });

  it("7. getSubscriptionStats computes global metrics accurately", async () => {
    const stats = await getSubscriptionStats();
    expect(stats.totalSubscriptions).toBeGreaterThan(0);
    expect(stats.uniqueSubscribers).toBeGreaterThan(0);
    expect(stats.activeSubscriptions).toBeGreaterThan(0);
    expect(stats.paidSubscribers).toBeGreaterThanOrEqual(1);
    expect(stats.totalRevenueKes).toBeGreaterThan(0);
    expect(stats.categoryBreakdown.length).toBeGreaterThan(0);
  });
});
