import { getDb } from "../db.server";

export type SubscriptionCategory =
  | "academy"
  | "news"
  | "market_alerts"
  | "weather_alerts"
  | "community"
  | "ai_services"
  | "marketplace_business"
  | "other";

export type SubscriptionStatus =
  | "active"
  | "pending_confirmation"
  | "pending_payment"
  | "expired"
  | "cancelled"
  | "unsubscribed"
  | "failed";

export type SubscriptionType = "free" | "paid_recurring" | "one_time" | "trial";

export type PaymentStatus = "paid" | "unpaid" | "pending" | "waived";

export interface RecordSubscriptionParams {
  userId?: string | null;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  category: SubscriptionCategory;
  serviceName: string;
  planCode?: string;
  subscriptionType?: SubscriptionType;
  status?: SubscriptionStatus;
  billingCycle?: "monthly" | "quarterly" | "annual" | "one_time" | "none";
  priceKes?: number;
  currency?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paymentStatus?: PaymentStatus;
  startedAt?: Date;
  expiresAt?: Date | null;
  nextBillingAt?: Date | null;
  metadata?: Record<string, any>;
  actorType?: "user" | "admin" | "system" | "webhook";
  actorEmail?: string;
  notes?: string;
}

export interface ListSubscriptionsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  paymentStatus?: string;
  sortBy?: "started_at" | "created_at" | "email" | "price_kes" | "status";
  sortOrder?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
}

/**
 * Automatically record, update, or upsert a subscription into PostgreSQL.
 * Ensures consistent user identity linking and idempotent execution.
 */
export async function recordSubscription(params: RecordSubscriptionParams) {
  const sql = getDb();
  const normalizedEmail = params.email.trim().toLowerCase();
  const serviceName = params.serviceName.trim();
  const category = params.category;
  const status = params.status || "active";
  const subscriptionType = params.subscriptionType || (Number(params.priceKes || 0) > 0 ? "paid_recurring" : "free");
  const billingCycle = params.billingCycle || (subscriptionType === "paid_recurring" ? "monthly" : "none");
  const priceKes = Number(params.priceKes || 0);
  const paymentStatus = params.paymentStatus || (priceKes > 0 ? "unpaid" : "waived");
  const metadata = params.metadata || {};

  // Try to associate with existing user if userId is not explicitly provided
  let resolvedUserId = params.userId || null;
  let resolvedFullName = params.fullName || null;
  let resolvedPhone = params.phone || null;

  if (!resolvedUserId) {
    const [matchedUser] = await sql`
      SELECT id, first_name, last_name, phone_number 
      FROM users 
      WHERE LOWER(email) = ${normalizedEmail} 
      LIMIT 1
    `;
    if (matchedUser) {
      resolvedUserId = matchedUser.id;
      if (!resolvedFullName && (matchedUser.first_name || matchedUser.last_name)) {
        resolvedFullName = `${matchedUser.first_name || ""} ${matchedUser.last_name || ""}`.trim();
      }
      if (!resolvedPhone) {
        resolvedPhone = matchedUser.phone_number;
      }
    }
  }

  // Check if subscription already exists
  const [existing] = await sql`
    SELECT * FROM subscriptions 
    WHERE email = ${normalizedEmail} 
      AND category = ${category} 
      AND service_name = ${serviceName}
    LIMIT 1
  `;

  let subId: string;
  let previousStatus: string | null = null;

  if (existing) {
    subId = existing.id;
    previousStatus = existing.status;

    await sql`
      UPDATE subscriptions SET
        user_id = COALESCE(${resolvedUserId}, user_id),
        full_name = COALESCE(${resolvedFullName}, full_name),
        phone = COALESCE(${resolvedPhone}, phone),
        plan_code = ${params.planCode || existing.plan_code},
        subscription_type = ${subscriptionType},
        status = ${status},
        billing_cycle = ${billingCycle},
        price_kes = ${priceKes},
        currency = ${params.currency || existing.currency || "KES"},
        payment_method = ${params.paymentMethod || existing.payment_method},
        payment_reference = COALESCE(${params.paymentReference || null}, payment_reference),
        payment_status = ${paymentStatus},
        expires_at = ${params.expiresAt !== undefined ? params.expiresAt : existing.expires_at},
        next_billing_at = ${params.nextBillingAt !== undefined ? params.nextBillingAt : existing.next_billing_at},
        cancelled_at = ${status === "cancelled" || status === "unsubscribed" ? new Date() : (status === "active" ? null : existing.cancelled_at)},
        metadata = subscriptions.metadata || ${JSON.stringify(metadata)}::jsonb,
        updated_at = NOW()
      WHERE id = ${subId}
    `;
  } else {
    const [inserted] = await sql`
      INSERT INTO subscriptions (
        user_id,
        email,
        full_name,
        phone,
        category,
        service_name,
        plan_code,
        subscription_type,
        status,
        billing_cycle,
        price_kes,
        currency,
        payment_method,
        payment_reference,
        payment_status,
        started_at,
        expires_at,
        next_billing_at,
        cancelled_at,
        metadata
      ) VALUES (
        ${resolvedUserId},
        ${normalizedEmail},
        ${resolvedFullName},
        ${resolvedPhone},
        ${category},
        ${serviceName},
        ${params.planCode || "standard"},
        ${subscriptionType},
        ${status},
        ${billingCycle},
        ${priceKes},
        ${params.currency || "KES"},
        ${params.paymentMethod || "none"},
        ${params.paymentReference || null},
        ${paymentStatus},
        ${params.startedAt || new Date()},
        ${params.expiresAt || null},
        ${params.nextBillingAt || null},
        ${status === "cancelled" || status === "unsubscribed" ? new Date() : null},
        ${JSON.stringify(metadata)}::jsonb
      )
      RETURNING id
    `;
    subId = inserted.id;
  }

  // Record audit event
  const eventType = existing
    ? (previousStatus !== status ? (status === "cancelled" ? "cancelled" : status === "unsubscribed" ? "unsubscribed" : "status_changed") : "renewed")
    : "created";

  await sql`
    INSERT INTO subscription_events (
      subscription_id,
      event_type,
      actor_type,
      actor_email,
      previous_status,
      new_status,
      notes,
      metadata
    ) VALUES (
      ${subId},
      ${eventType},
      ${params.actorType || "system"},
      ${params.actorEmail || normalizedEmail},
      ${previousStatus},
      ${status},
      ${params.notes || (existing ? "Subscription record updated" : "Subscription initialized")},
      ${JSON.stringify({
        category,
        serviceName,
        priceKes,
        paymentStatus,
        subscriptionType
      })}::jsonb
    )
  `;

  const [finalSub] = await sql`SELECT * FROM subscriptions WHERE id = ${subId}`;
  return finalSub;
}

/**
 * Update an existing subscription status (e.g. from Admin actions)
 */
export async function updateSubscriptionStatus(
  id: string,
  newStatus: SubscriptionStatus,
  actorEmail: string,
  notes?: string
) {
  const sql = getDb();
  const [existing] = await sql`SELECT * FROM subscriptions WHERE id = ${id}`;
  if (!existing) {
    throw new Error("Subscription not found");
  }

  const previousStatus = existing.status;
  const isCancelled = newStatus === "cancelled" || newStatus === "unsubscribed";

  await sql`
    UPDATE subscriptions SET
      status = ${newStatus},
      cancelled_at = ${isCancelled ? new Date() : (newStatus === "active" ? null : existing.cancelled_at)},
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
      ${isCancelled ? "cancelled" : "status_changed"},
      'admin',
      ${actorEmail},
      ${previousStatus},
      ${newStatus},
      ${notes || `Status changed from ${previousStatus} to ${newStatus}`}
    )
  `;

  const [updated] = await sql`SELECT * FROM subscriptions WHERE id = ${id}`;
  return updated;
}

/**
 * Fetch subscriptions with pagination, filtering, search, and sorting
 */
export async function getSubscriptionsList(query: ListSubscriptionsQuery) {
  const sql = getDb();
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const offset = (page - 1) * limit;

  const search = query.search?.trim().toLowerCase() || "";
  const category = query.category?.trim() || "";
  const status = query.status?.trim() || "";
  const paymentStatus = query.paymentStatus?.trim() || "";
  const sortBy = query.sortBy || "started_at";
  const sortOrder = query.sortOrder === "asc" ? "ASC" : "DESC";

  // Build conditions safely
  const conditions = [sql`1 = 1`];

  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(sql`(
      LOWER(subscriptions.email) ILIKE ${searchPattern} OR
      LOWER(COALESCE(subscriptions.full_name, '')) ILIKE ${searchPattern} OR
      LOWER(subscriptions.service_name) ILIKE ${searchPattern} OR
      COALESCE(subscriptions.phone, '') ILIKE ${searchPattern} OR
      COALESCE(subscriptions.payment_reference, '') ILIKE ${searchPattern}
    )`);
  }

  if (category && category !== "all") {
    conditions.push(sql`subscriptions.category = ${category}`);
  }

  if (status && status !== "all") {
    conditions.push(sql`subscriptions.status = ${status}`);
  }

  if (paymentStatus && paymentStatus !== "all") {
    conditions.push(sql`subscriptions.payment_status = ${paymentStatus}`);
  }

  if (query.startDate) {
    conditions.push(sql`subscriptions.started_at >= ${new Date(query.startDate)}`);
  }

  if (query.endDate) {
    conditions.push(sql`subscriptions.started_at <= ${new Date(query.endDate)}`);
  }

  const whereClause = conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`);

  // Total count matching filters
  const [countResult] = await sql`
    SELECT COUNT(*)::int AS total
    FROM subscriptions
    WHERE ${whereClause}
  `;
  const total = countResult?.total || 0;

  // Sorting columns whitelist
  let orderSql = sql`subscriptions.started_at DESC`;
  if (sortBy === "started_at") {
    orderSql = sortOrder === "ASC" ? sql`subscriptions.started_at ASC` : sql`subscriptions.started_at DESC`;
  } else if (sortBy === "created_at") {
    orderSql = sortOrder === "ASC" ? sql`subscriptions.created_at ASC` : sql`subscriptions.created_at DESC`;
  } else if (sortBy === "email") {
    orderSql = sortOrder === "ASC" ? sql`subscriptions.email ASC` : sql`subscriptions.email DESC`;
  } else if (sortBy === "price_kes") {
    orderSql = sortOrder === "ASC" ? sql`subscriptions.price_kes ASC` : sql`subscriptions.price_kes DESC`;
  } else if (sortBy === "status") {
    orderSql = sortOrder === "ASC" ? sql`subscriptions.status ASC` : sql`subscriptions.status DESC`;
  }

  const rows = await sql`
    SELECT 
      subscriptions.*,
      u.county as user_county,
      u.status as user_status
    FROM subscriptions
    LEFT JOIN users u ON u.id = subscriptions.user_id
    WHERE ${whereClause}
    ORDER BY ${orderSql}
    LIMIT ${limit} OFFSET ${offset}
  `;

  // Get distinct category counts for quick tab badges
  const categoryStats = await sql`
    SELECT category, COUNT(*)::int AS count
    FROM subscriptions
    GROUP BY category
  `;

  const categoryCounts: Record<string, number> = {
    all: total,
    academy: 0,
    news: 0,
    market_alerts: 0,
    weather_alerts: 0,
    community: 0,
    ai_services: 0,
    marketplace_business: 0,
    other: 0,
  };

  categoryStats.forEach((r: any) => {
    if (r.category in categoryCounts) {
      categoryCounts[r.category] = Number(r.count);
    }
  });

  return {
    subscriptions: rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
    categoryCounts,
  };
}

/**
 * Get high-level KPI metrics for summary cards
 */
export async function getSubscriptionStats() {
  const sql = getDb();

  const [stats] = await sql`
    SELECT
      COUNT(*)::int AS total_subscriptions,
      COUNT(DISTINCT email)::int AS unique_subscribers,
      COUNT(CASE WHEN status = 'active' THEN 1 END)::int AS active_subscriptions,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END)::int AS new_last_30_days,
      COUNT(CASE WHEN status IN ('cancelled', 'unsubscribed') THEN 1 END)::int AS cancelled_subscriptions,
      COUNT(CASE WHEN price_kes > 0 AND payment_status = 'paid' THEN 1 END)::int AS paid_subscribers,
      COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN price_kes ELSE 0 END), 0)::numeric AS total_revenue_kes
    FROM subscriptions
  `;

  const categoryBreakdown = await sql`
    SELECT 
      category,
      COUNT(*)::int AS count,
      COUNT(CASE WHEN status = 'active' THEN 1 END)::int AS active_count,
      COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN price_kes ELSE 0 END), 0)::numeric AS revenue
    FROM subscriptions
    GROUP BY category
  `;

  return {
    totalSubscriptions: stats?.total_subscriptions || 0,
    uniqueSubscribers: stats?.unique_subscribers || 0,
    activeSubscriptions: stats?.active_subscriptions || 0,
    newLast30Days: stats?.new_last_30_days || 0,
    cancelledSubscriptions: stats?.cancelled_subscriptions || 0,
    paidSubscribers: stats?.paid_subscribers || 0,
    totalRevenueKes: Number(stats?.total_revenue_kes || 0),
    categoryBreakdown: categoryBreakdown.map((c: any) => ({
      category: c.category,
      count: Number(c.count),
      activeCount: Number(c.active_count),
      revenue: Number(c.revenue),
    })),
  };
}

/**
 * Retrieve complete profile for a subscriber: all active/historical subscriptions + timeline
 */
export async function getSubscriberProfile(email: string) {
  const sql = getDb();
  const normalizedEmail = email.trim().toLowerCase();

  const userSubscriptions = await sql`
    SELECT * 
    FROM subscriptions 
    WHERE LOWER(email) = ${normalizedEmail}
    ORDER BY created_at DESC
  `;

  const subIds = userSubscriptions.map((s: any) => s.id);
  let events: any[] = [];
  if (subIds.length > 0) {
    events = await sql`
      SELECT 
        e.*,
        s.service_name,
        s.category
      FROM subscription_events e
      JOIN subscriptions s ON s.id = e.subscription_id
      WHERE e.subscription_id = ANY(${subIds})
      ORDER BY e.created_at DESC
      LIMIT 100
    `;
  }

  // User account details if registered
  const [user] = await sql`
    SELECT 
      u.id, 
      u.email, 
      u.first_name, 
      u.last_name, 
      u.phone_number, 
      u.county, 
      u.status, 
      u.farming_type,
      u.created_at,
      p.role,
      p.avatar_url,
      p.nature_of_agriculture
    FROM users u
    LEFT JOIN profiles p ON p.id = u.id OR LOWER(p.email) = LOWER(u.email)
    WHERE LOWER(u.email) = ${normalizedEmail}
    LIMIT 1
  `;

  return {
    email: normalizedEmail,
    user: user || null,
    subscriptions: userSubscriptions,
    events,
  };
}
