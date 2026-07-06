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
    const { userId, page = 1, limit = 10 } = data;
    await ensureAuthenticated(userId);

    const { getDb } = await import("../db.server");
    const sql = getDb();

    const offset = (page - 1) * limit;

    const orders = await sql`
      SELECT id, items, total, status, created_at
      FROM orders
      WHERE user_id = ${userId} AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return orders.map(o => {
      const itemsList = Array.isArray(o.items) ? o.items : [];
      const itemText = itemsList.map((i: any) => `${i.name} × ${i.quantity || 1}`).join(", ") || "Order Items";
      return {
        id: `ORD-${String(o.id).substring(0, 4).toUpperCase()}`,
        item: itemText,
        status: o.status,
        rawId: o.id
      };
    });
  });

export const getUserServiceBookings = createServerFn({ method: "GET" })
  .inputValidator(UserIdSchema)
  .handler(async ({ data: userId }) => {
    await ensureAuthenticated(userId);

    const { getDb } = await import("../db.server");
    const sql = getDb();

    const bookings = await sql`
      SELECT sr.id, sr.reference, s.name as service_name, sr.status, sr.scheduled_date
      FROM service_requests sr
      JOIN services s ON sr.service_id = s.id
      WHERE sr.user_id = ${userId}
      ORDER BY sr.created_at DESC
    `;

    return bookings.map(b => ({
      id: b.reference || `MQ-${String(b.id).substring(0, 6).toUpperCase()}`,
      item: b.service_name,
      status: b.status,
      scheduledDate: b.scheduled_date ? new Date(b.scheduled_date).toLocaleDateString() : "TBD",
      rawId: b.id
    }));
  });

export const getUserNotifications = createServerFn({ method: "GET" })
  .inputValidator(UserIdSchema)
  .handler(async ({ data: userId }) => {
    await ensureAuthenticated(userId);

    const { getDb } = await import("../db.server");
    const sql = getDb();

    let notifications = await sql`
      SELECT id, type, payload, read_at, created_at
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    if (notifications.length === 0) {
      // Seed default user notifications
      await sql`
        INSERT INTO notifications (user_id, type, payload)
        VALUES
          (
            ${userId},
            'weather',
            '{"title": "Rains expected by Wednesday", "sub": "Ideal time to plant maize in Uasin Gishu"}'::jsonb
          ),
          (
            ${userId},
            'promotion',
            '{"title": "10% off CAN fertilizer", "sub": "Limited offer — ends Sunday"}'::jsonb
          ),
          (
            ${userId},
            'report',
            '{"title": "Your soil report is ready", "sub": "Click to view recommendations"}'::jsonb
          )
      `;

      notifications = await sql`
        SELECT id, type, payload, read_at, created_at
        FROM notifications
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;
    }

    return notifications.map(n => ({
      id: n.id,
      title: n.payload?.title || n.type,
      sub: n.payload?.sub || n.payload?.message || "",
      readAt: n.read_at
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
