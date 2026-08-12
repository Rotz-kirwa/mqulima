import { db } from "./db.server";
import { adminAuditLogs } from "@/db/schema/admin";
import crypto from "node:crypto";

export interface AuditLogPayload {
  actorId?: string | null;
  action: string;
  entity?: string;
  entityType?: string;
  entityId?: string | null;
  diff?: any;
  ipAddress?: string | null;
}

export async function logAdminAction(payload: AuditLogPayload): Promise<void> {
  try {
    const id = crypto.randomUUID();
    const validActorId = payload.actorId || "system";

    await db.insert(adminAuditLogs).values({
      id,
      actorId: validActorId,
      action: payload.action,
      entityType: payload.entityType || payload.entity || "general",
      entityId: payload.entityId || null,
      diff: payload.diff ? JSON.parse(JSON.stringify(payload.diff)) : null,
      ipAddress: payload.ipAddress || null,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[AUDIT LOG ERROR] Failed to write admin audit log:", error);
  }
}

export const writeAuditLog = logAdminAction;
