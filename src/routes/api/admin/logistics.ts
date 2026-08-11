import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { logisticsRecords } from "@/db/schema/admin";
import { orders } from "@/db/schema/orders";
import { eq, desc } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";

export const Route = createFileRoute("/api/admin/logistics")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          let list = await db
            .select()
            .from(logisticsRecords)
            .orderBy(desc(logisticsRecords.createdAt))
            .limit(100);

          if (list.length === 0) {
            const sampleOrders = await db.select().from(orders).limit(5);

            for (let i = 0; i < sampleOrders.length; i++) {
              const ord = sampleOrders[i];
              await db.insert(logisticsRecords).values({
                id: `log-${ord.id}`,
                orderId: ord.id,
                courierName: i % 2 === 0 ? "Fargo Courier" : "EasyCoach Logistics",
                zone: i % 2 === 0 ? "Rift Valley (Nakuru)" : "Central (Nyeri)",
                dispatchStatus: ord.status === "shipped" ? "dispatched" : "pending",
                trackingNumber: `TRK-MQ-${1000 + i}`,
                proofUrl: null,
                createdAt: ord.createdAt || new Date(),
              });
            }

            list = await db
              .select()
              .from(logisticsRecords)
              .orderBy(desc(logisticsRecords.createdAt))
              .limit(100);
          }

          return new Response(JSON.stringify({ success: true, logistics: list }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      POST: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          const body = await request.json();
          const { id, dispatchStatus, courierName, proofUrl, actorId = "system-admin" } = body;

          await db
            .update(logisticsRecords)
            .set({ dispatchStatus, courierName, proofUrl })
            .where(eq(logisticsRecords.id, id));

          await logAdminAction({
            actorId,
            action: "LOGISTICS_UPDATE",
            entity: "logistics_records",
            entityId: id,
            diff: { dispatchStatus, courierName },
          });

          return new Response(JSON.stringify({ success: true, message: "Logistics record updated" }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
