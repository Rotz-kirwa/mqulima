import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const UserIdSchema = z.string().uuid();
const PageLimitSchema = z.object({
  userId: z.string().uuid(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10)
});

const MarkReadSchema = z.object({
  notificationId: z.string().uuid(),
  userId: z.string().uuid(),
  csrfToken: z.string()
});

async function ensureAuthenticated(userId: string) {
  const { getCurrentUser } = await import("../auth-server");
  let user: any = null;
  try {
    user = await getCurrentUser();
  } catch (e) {}

  if (!user) {
    throw new Error("Unauthorized: Please sign in to access your dashboard records");
  }

  if (user.id !== userId && user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Forbidden: You cannot access another user's dashboard records");
  }

  return user;
}

export const getUserOrders = createServerFn({ method: "GET" })
  .inputValidator(PageLimitSchema)
  .handler(async ({ data }) => {
    const { userId, page = 1, limit = 20 } = data;
    await ensureAuthenticated(userId);

    const { getDb } = await import("../db.server");
    const sql = getDb();

    const offset = (page - 1) * limit;

    const orders = await sql`
      SELECT id, items, subtotal, total, status, payment_method, payment_status, delivery_address, notes, created_at
      FROM orders
      WHERE user_id = ${userId} 
        AND deleted_at IS NULL
        AND (payment_status = 'paid' OR status IN ('confirmed', 'paid', 'processing', 'shipped', 'delivered'))
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return orders.map(o => {
      const itemsList = Array.isArray(o.items) ? o.items : [];
      const itemText = itemsList.map((i: any) => `${i.name || i.title || "Product"} × ${i.quantity || 1}`).join(", ") || "Shop Product Purchase";
      return {
        id: `ORD-${String(o.id).substring(0, 8).toUpperCase()}`,
        rawId: o.id,
        items: itemsList,
        item: itemText,
        subtotal: Number(o.subtotal || o.total || 0),
        total: Number(o.total || 0),
        status: o.status || "pending",
        paymentMethod: o.payment_method || "M-Pesa",
        paymentStatus: o.payment_status || "pending",
        deliveryAddress: o.delivery_address || "Standard Farm Delivery",
        notes: o.notes || "",
        createdAt: o.created_at ? new Date(o.created_at).toLocaleDateString("en-KE", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Recently"
      };
    });
  });

export const getUserServiceBookings = createServerFn({ method: "GET" })
  .inputValidator(UserIdSchema)
  .handler(async ({ data: userId }) => {
    const user = await ensureAuthenticated(userId);

    const { getDb } = await import("../db.server");
    const sql = getDb();

    const bookings = await sql`
      SELECT 
        sr.id, 
        sr.reference, 
        COALESCE(s.name, sr.subservice_name, 'Agricultural Service') as service_name,
        sr.subservice_name,
        sr.status, 
        sr.scheduled_date,
        sr.location,
        sr.contact_name,
        sr.contact_phone,
        sr.farm_scale,
        sr.notes,
        sr.estimated_cost,
        sr.created_at,
        p.full_name as expert_name,
        p.phone as expert_phone
      FROM service_requests sr
      LEFT JOIN services s ON sr.service_id = s.id
      LEFT JOIN profiles p ON sr.assigned_expert_id = p.id
      WHERE sr.user_id = ${userId} OR sr.contact_phone = ${(user as any).phone || '000'}
      ORDER BY sr.created_at DESC
    `;

    return bookings.map(b => ({
      id: b.reference || `MQ-SRV-${String(b.id).substring(0, 6).toUpperCase()}`,
      rawId: b.id,
      item: b.service_name || "Farm Extension Service",
      serviceName: b.service_name || "Farm Extension Service",
      subserviceName: b.subservice_name || b.service_name || "Specialist Service",
      status: b.status || "requested",
      scheduledDate: b.scheduled_date ? new Date(b.scheduled_date).toLocaleDateString("en-KE", { year: 'numeric', month: 'short', day: 'numeric' }) : "Pending Schedule",
      location: b.location || "Farm Site",
      contactName: b.contact_name || user.name,
      contactPhone: b.contact_phone || (user as any).phone || "N/A",
      farmScale: b.farm_scale || "Standard",
      notes: b.notes || "No special instructions provided",
      estimatedCost: b.estimated_cost ? Number(b.estimated_cost) : 0,
      createdAt: b.created_at ? new Date(b.created_at).toLocaleDateString("en-KE", { year: 'numeric', month: 'short', day: 'numeric' }) : "Recently",
      expertName: b.expert_name || null,
      expertPhone: b.expert_phone || null
    }));
  });

export const getUserNotifications = createServerFn({ method: "GET" })
  .inputValidator(UserIdSchema)
  .handler(async ({ data: userId }) => {
    await ensureAuthenticated(userId);

    const { getDb } = await import("../db.server");
    const sql = getDb();

    const notifications = await sql`
      SELECT id, type, payload, read_at, created_at
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return notifications.map(n => ({
      id: n.id,
      title: n.payload?.title || n.type,
      sub: n.payload?.sub || n.payload?.message || "",
      readAt: n.read_at,
      type: n.type,
      payload: n.payload
    }));
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .inputValidator(MarkReadSchema)
  .handler(async ({ data }) => {
    const { notificationId, userId, csrfToken } = data;

    // 1. CSRF Token Validation
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(csrfToken);

    await ensureAuthenticated(userId);

    const { getDb } = await import("../db.server");
    const sql = getDb();

    await sql`
      UPDATE notifications
      SET read_at = NOW()
      WHERE id = ${notificationId} AND user_id = ${userId}
    `;

    return { success: true };
  });

export const getUserForumPosts = createServerFn({ method: "GET" })
  .inputValidator(UserIdSchema)
  .handler(async ({ data: userId }) => {
    await ensureAuthenticated(userId);
    const { getDb } = await import("../db.server");
    const sql = getDb();

    const rows = await sql`
      SELECT
        id,
        COALESCE(title, '') AS title,
        COALESCE(caption, '') AS text,
        COALESCE(tags, ARRAY[]::text[]) AS tags,
        COALESCE(like_count, 0) AS likes,
        COALESCE(comment_count, 0) AS comment_count,
        media_urls,
        created_at
      FROM show_posts
      WHERE user_id = ${userId}
        AND deleted_at IS NULL
        AND (status IS NULL OR status IN ('published', 'active'))
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return rows.map((r: any) => ({
      id: r.id,
      title: r.title || "Community Discussion",
      text: r.text || "",
      tags: Array.isArray(r.tags) ? r.tags : [],
      likes: Number(r.likes || 0),
      commentCount: Number(r.comment_count || 0),
      mediaUrls: Array.isArray(r.media_urls) ? r.media_urls : [],
      createdAt: r.created_at
        ? new Date(r.created_at).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })
        : "Recently",
    }));
  });

export const getUserSavedForumPosts = createServerFn({ method: "GET" })
  .inputValidator(UserIdSchema)
  .handler(async ({ data: userId }) => {
    await ensureAuthenticated(userId);
    const { getDb } = await import("../db.server");
    const sql = getDb();

    const rows = await sql`
      SELECT
        sp.id,
        COALESCE(sp.title, '') AS title,
        COALESCE(sp.caption, '') AS text,
        COALESCE(sp.tags, ARRAY[]::text[]) AS tags,
        COALESCE(sp.like_count, 0) AS likes,
        COALESCE(sp.comment_count, 0) AS comment_count,
        COALESCE(p.full_name, 'Mqulima Farmer') AS author,
        sp.created_at
      FROM show_bookmarks sb
      INNER JOIN show_posts sp ON sp.id = sb.post_id
      LEFT JOIN profiles p ON p.id = sp.user_id
      WHERE sb.user_id = ${userId}
        AND sp.deleted_at IS NULL
        AND (sp.status IS NULL OR sp.status IN ('published', 'active'))
      ORDER BY sb.created_at DESC
      LIMIT 50
    `;

    return rows.map((r: any) => ({
      id: r.id,
      title: r.title || "Saved Discussion",
      text: r.text || "",
      tags: Array.isArray(r.tags) ? r.tags : [],
      likes: Number(r.likes || 0),
      commentCount: Number(r.comment_count || 0),
      author: r.author || "Mqulima Farmer",
      createdAt: r.created_at
        ? new Date(r.created_at).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })
        : "Recently",
    }));
  });

const SavedProductsSchema = z.object({
  ids: z.array(z.string()).max(100),
});

export const getSavedProductsDetails = createServerFn({ method: "GET" })
  .inputValidator(SavedProductsSchema)
  .handler(async ({ data }) => {
    const ids = Array.from(new Set(data.ids.map((id) => id.trim()).filter(Boolean)));
    if (ids.length === 0) return [];

    const { getDb } = await import("../db.server");
    const { resolveFastProductImage } = await import("./shop.server");
    const sql = getDb();

    const rows = await sql`
      SELECT
        p.id,
        p.slug,
        p.name,
        p.base_price,
        p.original_price,
        p.stock_qty,
        p.status,
        p.unit,
        p.county,
        p.subcategory,
        p.field,
        p.image_urls,
        COALESCE(sc.name, pc.name, p.subcategory, p.field, 'Farm Essentials') AS category_name
      FROM products p
      LEFT JOIN shop_categories sc ON p.category_id = sc.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE (p.id::text = ANY(${ids}) OR p.external_product_id = ANY(${ids}) OR p.slug = ANY(${ids}))
        AND p.deleted_at IS NULL
    `;

    return rows.map((p: any) => ({
      id: p.id,
      slug: p.slug || p.id,
      name: p.name,
      price: Number(p.base_price || 0),
      originalPrice: p.original_price ? Number(p.original_price) : null,
      stock: p.status === "draft" ? Number(p.stock_qty || 0) : 9999,
      unit: p.unit || "/unit",
      county: p.county || "Kenya",
      category: p.category_name || "Farm Essentials",
      image: resolveFastProductImage(p),
    }));
  });

const UpdateAccountProfileSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().trim().min(2, "Full name must be at least 2 characters"),
  phone: z.string().trim().optional().default(""),
  county: z.string().trim().min(2, "County is required"),
  yearsFarming: z.number().int().min(0).max(100).optional().default(0),
  crops: z.string().optional().default(""),
  livestock: z.string().optional().default(""),
  csrfToken: z.string(),
});

export const updateAccountProfile = createServerFn({ method: "POST" })
  .inputValidator(UpdateAccountProfileSchema)
  .handler(async ({ data }) => {
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(data.csrfToken);

    await ensureAuthenticated(data.userId);
    const { getDb } = await import("../db.server");
    const sql = getDb();

    const cropsArr = data.crops
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const livestockArr = data.livestock
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const cleanPhone = data.phone.trim() || null;

    await sql.begin(async (tx: any) => {
      await tx`
        UPDATE profiles
        SET full_name = ${data.name},
            phone = ${cleanPhone},
            county_region = ${data.county},
            years_farming = ${data.yearsFarming},
            crops = ${cropsArr},
            livestock = ${livestockArr},
            updated_at = NOW()
        WHERE id = ${data.userId}
      `;

      const [userRow] = await tx`SELECT id FROM users WHERE id = ${data.userId}`;
      if (userRow) {
        const parts = data.name.split(/\s+/);
        const firstName = parts[0] || "";
        const lastName = parts.slice(1).join(" ") || "";
        await tx`
          UPDATE users
          SET first_name = ${firstName},
              last_name = ${lastName},
              phone_number = COALESCE(${cleanPhone}, phone_number),
              county = ${data.county}
          WHERE id = ${data.userId}
        `;
      }
    });

    return {
      success: true,
      user: {
        name: data.name,
        phone: data.phone.trim(),
        county: data.county,
        yearsFarming: data.yearsFarming,
        farmSize: data.yearsFarming > 0 ? `${data.yearsFarming} years` : "",
        crops: cropsArr.join(", "),
        livestock: livestockArr.join(", "),
      },
    };
  });

const DeleteAccountSchema = z.object({
  userId: z.string().uuid(),
  csrfToken: z.string(),
});

export const deleteUserAccount = createServerFn({ method: "POST" })
  .inputValidator(DeleteAccountSchema)
  .handler(async ({ data }) => {
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(data.csrfToken);

    const caller = await ensureAuthenticated(data.userId);
    if (caller.id !== data.userId) {
      throw new Error("Forbidden: You can only delete your own account.");
    }
    if (caller.role === "admin" || caller.role === "super_admin") {
      throw new Error("Administrator accounts cannot be self-deleted.");
    }

    const { anonymizeUserAccount } = await import("../account-anonymize.server");
    await anonymizeUserAccount(data.userId);

    const { setCookie } = await import("@tanstack/react-start/server");
    setCookie("mq_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return { success: true, deleted: true };
  });
