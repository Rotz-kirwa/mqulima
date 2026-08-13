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
  const user = await getCurrentUser();
  if (!user || user.id !== userId) {
    throw new Error("Unauthorized");
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
      WHERE user_id = ${userId} AND deleted_at IS NULL
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
