import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getCurrentUser } from "../auth-server";
import { RBACService, SecurityUserContext, UserRole } from "../rbac.server";
import { getDb } from "../db.server";
import { logAdminAction } from "../audit.server";

const AssignActionSchema = z.object({
  id: z.string().uuid("Invalid service request ID"),
  assignedAgent: z.string().min(1, "Assigned expert/agent is required"),
  targetStatus: z.enum(["requested", "assigned", "in_progress", "completed", "cancelled"]).optional().default("assigned"),
  notes: z.string().max(500).optional(),
  csrfToken: z.string()
});

const StatusUpdateSchema = z.object({
  id: z.string().uuid("Invalid service request ID"),
  targetStatus: z.enum(["requested", "assigned", "in_progress", "completed", "cancelled"]),
  notes: z.string().max(500).optional(),
  csrfToken: z.string()
});

const LEGAL_STATUS_TRANSITIONS: Record<string, string[]> = {
  requested: ["assigned", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

async function assertAdminAccess(requiredScope: "services:read" | "services:write") {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Authentication required");
  }

  const secUser: SecurityUserContext = {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    fullName: user.name,
  };

  RBACService.assertScope(secUser, requiredScope);
  return user;
}

export const adminGetServiceRequests = createServerFn({ method: "GET" })
  .handler(async () => {
    await assertAdminAccess("services:read");

    const sql = getDb();

    const list = await sql`
      SELECT 
        sr.id,
        sr.reference,
        sr.status,
        sr.contact_name,
        sr.contact_phone,
        sr.location,
        sr.subservice_name,
        sr.farm_scale,
        sr.channel,
        sr.notes,
        sr.estimated_cost,
        sr.created_at,
        sr.scheduled_date,
        sr.assigned_expert_id,
        s.name as service_category_name,
        p.full_name as user_full_name,
        p.phone as user_phone,
        p.email as user_email,
        e.full_name as expert_name
      FROM service_requests sr
      LEFT JOIN services s ON sr.service_id = s.id
      LEFT JOIN profiles p ON sr.user_id = p.id
      LEFT JOIN profiles e ON sr.assigned_expert_id = e.id
      ORDER BY sr.created_at DESC
      LIMIT 100
    `;

    return list.map((s: any) => ({
      id: s.id,
      referenceCode: s.reference || `SRV-${String(s.id).slice(0, 6).toUpperCase()}`,
      serviceType: s.subservice_name || s.service_category_name || "Agronomy Service",
      fullName: s.contact_name || s.user_full_name || "Guest Farmer",
      phone: s.contact_phone || s.user_phone || "N/A",
      email: s.user_email || "N/A",
      county: s.location || "Kenya",
      farmScale: s.farm_scale || "Standard",
      assignedTechnician: s.expert_name || (s.assigned_expert_id ? "Assigned Expert" : null),
      assignedExpertId: s.assigned_expert_id,
      status: s.status,
      createdAt: s.created_at,
      scheduledDate: s.scheduled_date,
      channel: s.channel || "website",
      estimatedCost: s.estimated_cost ? Number(s.estimated_cost) : 0,
      notes: s.notes || "",
      isGuest: !s.user_full_name
    }));
  });

export const adminAssignServiceExpert = createServerFn({ method: "POST" })
  .inputValidator(AssignActionSchema)
  .handler(async ({ data }) => {
    const { id, assignedAgent, targetStatus = "assigned", notes, csrfToken } = data;

    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(csrfToken);

    const user = await assertAdminAccess("services:write");

    const sql = getDb();

    const [existing] = await sql`
      SELECT id, status, reference, assigned_expert_id
      FROM service_requests
      WHERE id = ${id}
    `;

    if (!existing) {
      throw new Error("Service request not found");
    }

    const currentStatus = existing.status;
    const allowed = LEGAL_STATUS_TRANSITIONS[currentStatus] || [];
    if (targetStatus !== currentStatus && !allowed.includes(targetStatus)) {
      throw new Error(`Illegal status transition from '${currentStatus}' to '${targetStatus}'`);
    }

    await sql`
      UPDATE service_requests
      SET 
        status = ${targetStatus},
        notes = COALESCE(notes, '') || ${notes ? `\n[Assignment Note]: ${notes}` : ''},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    await logAdminAction({
      actorId: user.id,
      action: "ASSIGN_SERVICE_EXPERT",
      entity: "SERVICE_REQUEST",
      entityId: id,
      diff: {
        assignedAgent,
        previousStatus: currentStatus,
        newStatus: targetStatus,
        notes: notes || null,
        reference: existing.reference
      }
    });

    return {
      success: true,
      message: `Assigned service request ${existing.reference || id} to ${assignedAgent} (Status: ${targetStatus})`
    };
  });

export const adminUpdateServiceStatus = createServerFn({ method: "POST" })
  .inputValidator(StatusUpdateSchema)
  .handler(async ({ data }) => {
    const { id, targetStatus, notes, csrfToken } = data;

    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(csrfToken);

    const user = await assertAdminAccess("services:write");

    const sql = getDb();

    const [existing] = await sql`
      SELECT id, status, reference
      FROM service_requests
      WHERE id = ${id}
    `;

    if (!existing) {
      throw new Error("Service request not found");
    }

    const currentStatus = existing.status;
    const allowed = LEGAL_STATUS_TRANSITIONS[currentStatus] || [];
    if (targetStatus !== currentStatus && !allowed.includes(targetStatus)) {
      throw new Error(`Illegal status transition from '${currentStatus}' to '${targetStatus}'`);
    }

    await sql`
      UPDATE service_requests
      SET 
        status = ${targetStatus},
        notes = COALESCE(notes, '') || ${notes ? `\n[Status Update Note]: ${notes}` : ''},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    await logAdminAction({
      actorId: user.id,
      action: "UPDATE_SERVICE_STATUS",
      entity: "SERVICE_REQUEST",
      entityId: id,
      diff: {
        previousStatus: currentStatus,
        newStatus: targetStatus,
        notes: notes || null,
        reference: existing.reference
      }
    });

    return {
      success: true,
      message: `Updated service request ${existing.reference || id} status to '${targetStatus}'`
    };
  });
