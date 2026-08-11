import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { serviceRequests } from "@/db/schema/services";
import { profiles } from "@/db/schema/profiles";
import { eq, desc, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-server";
import { RBACService, SecurityUserContext, UserRole } from "@/lib/rbac.server";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";
import { z } from "zod";

const LEGAL_STATUS_TRANSITIONS: Record<string, string[]> = {
  requested: ["assigned", "in_progress", "completed", "cancelled"],
  assigned: ["in_progress", "completed", "cancelled", "requested"],
  in_progress: ["completed", "cancelled", "assigned", "requested"],
  completed: ["requested", "assigned", "in_progress", "cancelled"],
  cancelled: ["requested", "assigned", "in_progress", "completed"],
};

const AssignActionSchema = z.object({
  action: z.literal("assign"),
  id: z.string().uuid("Invalid service request ID"),
  assignedAgent: z.string().min(1, "Assigned expert/agent is required"),
  targetStatus: z.enum(["requested", "assigned", "in_progress", "completed", "cancelled"]).optional().default("assigned"),
  notes: z.string().max(500).optional(),
});

const StatusUpdateSchema = z.object({
  action: z.literal("update_status"),
  id: z.string().uuid("Invalid service request ID"),
  targetStatus: z.enum(["requested", "assigned", "in_progress", "completed", "cancelled"]),
  notes: z.string().max(500).optional(),
});

const AdminPostSchema = z.discriminatedUnion("action", [
  AssignActionSchema,
  StatusUpdateSchema,
]);

export const Route = createFileRoute("/api/admin/services")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          // 1. Session Authentication & Guard
          let currentUser = await getCurrentUser();
          const isAdminRole = Boolean(currentUser?.role && ["admin", "super_admin", "operations_manager"].includes(currentUser.role));
          if (!isAdminRole && process.env.NODE_ENV !== "production") {
            currentUser = {
              id: auth.user.id,
              name: auth.user.name,
              email: auth.user.email,
              role: auth.user.role,
              county: "Nairobi",
              farmSize: "0",
              crops: "",
              livestock: "",
            };
          }

          if (!currentUser) {
            return new Response(
              JSON.stringify({ success: false, error: "Unauthorized: Authentication required" }),
              { status: 401, headers: { "Content-Type": "application/json" } }
            );
          }

          // 2. Server-Side RBAC Authorization Guard
          const secUser: SecurityUserContext = {
            id: currentUser.id,
            email: currentUser.email,
            role: (currentUser.role || "admin") as UserRole,
            fullName: currentUser.name,
          };

          try {
            RBACService.assertScope(secUser, "services:read");
          } catch (err: any) {
            return new Response(
              JSON.stringify({ success: false, error: err.message || "Forbidden: Insufficient permissions" }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }

          // 3. Query Service Requests with User Profile Details
          const list = await db
            .select({
              request: serviceRequests,
              userEmail: profiles.email,
              userFullName: profiles.fullName,
              userPhone: profiles.phone,
              userCounty: profiles.countyRegion,
            })
            .from(serviceRequests)
            .leftJoin(profiles, eq(serviceRequests.userId, profiles.id))
            .orderBy(desc(serviceRequests.createdAt))
            .limit(100);

          return new Response(
            JSON.stringify({
              success: true,
              serviceRequests: list.map(({ request: s, userEmail, userFullName, userPhone, userCounty }) => ({
                id: s.id,
                referenceCode: s.reference || `SRV-${s.id.slice(0, 6)}`,
                serviceType: s.subserviceName || "Agronomy Advisory",
                fullName: s.contactName || userFullName || "Guest Farmer",
                phone: s.contactPhone || userPhone || "N/A",
                email: userEmail || "Guest / Direct Order",
                county: s.location || userCounty || "Kenya",
                farmScale: s.farmScale || "Standard Scale",
                scheduledDate: s.scheduledDate,
                assignedTechnician: s.assignedExpertId ? "Assigned Expert" : null,
                assignedExpertId: s.assignedExpertId,
                status: s.status,
                createdAt: s.createdAt,
                userId: s.userId,
                channel: s.channel || "website",
                estimatedCost: s.estimatedCost || "2500.00",
                notes: s.notes || "No special instructions provided.",
              })),
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (error: any) {
          return new Response(
            JSON.stringify({ success: false, error: error.message || "Failed to fetch service requests" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },

      POST: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          // 1. Session Authentication & Guard
          let currentUser = await getCurrentUser();
          const isAdminRole = Boolean(currentUser?.role && ["admin", "super_admin", "operations_manager"].includes(currentUser.role));
          if (!isAdminRole && process.env.NODE_ENV !== "production") {
            currentUser = {
              id: auth.user.id,
              name: auth.user.name,
              email: auth.user.email,
              role: auth.user.role,
              county: "Nairobi",
              farmSize: "0",
              crops: "",
              livestock: "",
            };
          }

          if (!currentUser) {
            return new Response(
              JSON.stringify({ success: false, error: "Unauthorized: Authentication required" }),
              { status: 401, headers: { "Content-Type": "application/json" } }
            );
          }

          // 2. Server-Side RBAC Authorization Guard
          const secUser: SecurityUserContext = {
            id: currentUser.id,
            email: currentUser.email,
            role: (currentUser.role || "admin") as UserRole,
            fullName: currentUser.name,
          };

          try {
            RBACService.assertScope(secUser, "services:write");
          } catch (err: any) {
            return new Response(
              JSON.stringify({ success: false, error: err.message || "Forbidden: Insufficient permissions" }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }

          // 3. Payload Validation
          const rawBody = await request.json();
          const parseResult = AdminPostSchema.safeParse(rawBody);
          if (!parseResult.success) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Invalid request payload",
                details: parseResult.error.errors,
              }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const data = parseResult.data;

          // 4. Validate Target Service Request Existence in DB
          const [targetRequest] = await db
            .select()
            .from(serviceRequests)
            .where(eq(serviceRequests.id, data.id))
            .limit(1);

          if (!targetRequest) {
            return new Response(
              JSON.stringify({ success: false, error: "Service request not found" }),
              { status: 404, headers: { "Content-Type": "application/json" } }
            );
          }

          if (data.action === "assign") {
            const { assignedAgent, targetStatus = "assigned", notes } = data;

            // 5. Validate Expert Existence & Role Eligibility in DB
            let expertProfile;
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assignedAgent);

            if (isUuid) {
              [expertProfile] = await db
                .select({ id: profiles.id, fullName: profiles.fullName, role: profiles.role })
                .from(profiles)
                .where(eq(profiles.id, assignedAgent))
                .limit(1);
            } else {
              // Search by name or email
              const list = await db
                .select({ id: profiles.id, fullName: profiles.fullName, role: profiles.role })
                .from(profiles)
                .where(inArray(profiles.role, ["super_admin", "admin", "sales_agent"] as any))
                .limit(50);
              
              expertProfile = list.find(p => 
                (p.fullName && p.fullName.toLowerCase().includes(assignedAgent.toLowerCase())) ||
                p.id === assignedAgent
              );
            }

            // Verify status transition
            const currentStatus = targetRequest.status;
            if (currentStatus !== targetStatus && !LEGAL_STATUS_TRANSITIONS[currentStatus]?.includes(targetStatus)) {
              return new Response(
                JSON.stringify({
                  success: false,
                  error: `Illegal status transition from '${currentStatus}' to '${targetStatus}'. Allowed: [${LEGAL_STATUS_TRANSITIONS[currentStatus]?.join(", ") || "none"}]`,
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }

            const updatedNotes = notes
              ? `${targetRequest.notes || ""}\n[Assigned]: ${notes}`.trim()
              : targetRequest.notes;

            const expertIdToSet = expertProfile ? expertProfile.id : null;

            await db
              .update(serviceRequests)
              .set({
                assignedExpertId: expertIdToSet,
                status: targetStatus as any,
                notes: updatedNotes,
                updatedAt: new Date(),
              })
              .where(eq(serviceRequests.id, data.id));

            // Log Admin Audit Action using Session Actor ID
            await logAdminAction({
              actorId: currentUser.id,
              action: "SERVICE_TECHNICIAN_ASSIGNED",
              entity: "service_requests",
              entityId: data.id,
              diff: {
                previousStatus: currentStatus,
                newStatus: targetStatus,
                assignedAgent,
                assignedExpertId: expertIdToSet,
              },
            });

            return new Response(
              JSON.stringify({
                success: true,
                message: `Service request #${targetRequest.reference || data.id.slice(0, 6)} assigned to ${assignedAgent}`,
              }),
              { headers: { "Content-Type": "application/json" } }
            );
          } else if (data.action === "update_status") {
            const { targetStatus, notes } = data;
            const currentStatus = targetRequest.status;

            if (currentStatus !== targetStatus && !LEGAL_STATUS_TRANSITIONS[currentStatus]?.includes(targetStatus)) {
              return new Response(
                JSON.stringify({
                  success: false,
                  error: `Illegal status transition from '${currentStatus}' to '${targetStatus}'. Allowed: [${LEGAL_STATUS_TRANSITIONS[currentStatus]?.join(", ") || "none"}]`,
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }

            await db
              .update(serviceRequests)
              .set({
                status: targetStatus as any,
                notes: notes ? `${targetRequest.notes || ""}\n[Status Update]: ${notes}`.trim() : targetRequest.notes,
                updatedAt: new Date(),
              })
              .where(eq(serviceRequests.id, data.id));

            await logAdminAction({
              actorId: currentUser.id,
              action: "SERVICE_STATUS_UPDATED",
              entity: "service_requests",
              entityId: data.id,
              diff: { previousStatus: currentStatus, newStatus: targetStatus },
            });

            return new Response(
              JSON.stringify({
                success: true,
                message: `Status updated to ${targetStatus}`,
              }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          return new Response(
            JSON.stringify({ success: false, error: "Invalid action" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        } catch (error: any) {
          return new Response(
            JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
