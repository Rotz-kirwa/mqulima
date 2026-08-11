import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface UserNotificationItem {
  id: string;
  tag: string;
  tagClass: string;
  title: string;
  desc: string;
  details?: Record<string, any> | null;
  time: string;
  read: boolean;
  link: string;
  type: string;
}

export const getUserNotifications = createServerFn({ method: "GET" })
  .handler(async (): Promise<UserNotificationItem[]> => {
    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();

    // STRICT REQUIREMENT: Only visible/accessible when user is logged in
    if (!user) {
      return [];
    }

    const { getDb } = await import("../db.server");
    const sql = getDb();

    const rows = await sql`
      SELECT id, type, payload, read_at, created_at
      FROM notifications
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 30
    `;

    return rows.map((n: any) => {
      const p = typeof n.payload === "string" ? JSON.parse(n.payload) : (n.payload || {});
      
      let defaultTag = "Notification";
      let defaultTagClass = "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
      let defaultLink = "/shop";

      if (n.type === "product_purchase") {
        defaultTag = "Order Update";
        defaultTagClass = "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
        defaultLink = "/shop";
      } else if (n.type === "service_request_submitted") {
        defaultTag = "Booking";
        defaultTagClass = "bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300";
        defaultLink = "/services";
      }

      const formattedTime = new Date(n.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      return {
        id: n.id,
        tag: p.tag || defaultTag,
        tagClass: p.tagClass || defaultTagClass,
        title: p.title || p.sub || "System Notification",
        desc: p.desc || p.message || p.body || "No additional information provided.",
        details: p.details || null,
        time: p.time || formattedTime,
        read: !!n.read_at,
        link: p.link || defaultLink,
        type: n.type
      };
    });
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    notificationId: z.string(),
    csrfToken: z.string().optional()
  }))
  .handler(async ({ data }) => {
    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user) return { success: false };

    const { getDb } = await import("../db.server");
    const sql = getDb();

    await sql`
      UPDATE notifications
      SET read_at = NOW()
      WHERE id = ${data.notificationId} AND user_id = ${user.id}
    `;

    return { success: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    csrfToken: z.string().optional()
  }))
  .handler(async () => {
    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user) return { success: false };

    const { getDb } = await import("../db.server");
    const sql = getDb();

    await sql`
      UPDATE notifications
      SET read_at = NOW()
      WHERE user_id = ${user.id} AND read_at IS NULL
    `;

    return { success: true };
  });
