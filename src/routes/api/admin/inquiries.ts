import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/lib/db.server";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";

export const Route = createFileRoute("/api/admin/inquiries")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          const sql = getDb();

          // Ensure columns exist on contact_submissions & partnership_applications
          await sql`
            ALTER TABLE contact_submissions 
            ADD COLUMN IF NOT EXISTS status varchar(50) DEFAULT 'open',
            ADD COLUMN IF NOT EXISTS assigned_staff varchar(100) DEFAULT 'Unassigned',
            ADD COLUMN IF NOT EXISTS admin_notes text;
          `;

          await sql`
            ALTER TABLE partnership_applications 
            ADD COLUMN IF NOT EXISTS status varchar(50) DEFAULT 'open',
            ADD COLUMN IF NOT EXISTS assigned_staff varchar(100) DEFAULT 'Unassigned',
            ADD COLUMN IF NOT EXISTS admin_notes text;
          `;

          // 1. Fetch Contact Submissions
          const contacts = await sql`
            SELECT id, name, email, message, status, assigned_staff, admin_notes, created_at
            FROM contact_submissions
            ORDER BY created_at DESC
          `;

          // 2. Fetch Partnership Applications
          const partnerships = await sql`
            SELECT id, org_name, contact_email, details, status, assigned_staff, admin_notes, created_at
            FROM partnership_applications
            ORDER BY created_at DESC
          `;

          // 3. Fetch Service Requests
          const services = await sql`
            SELECT id, reference, contact_name, contact_phone, subservice_name, location, status, notes, created_at
            FROM service_requests
            ORDER BY created_at DESC
          `;

          // 4. Fetch Stock Sourcing Requests
          await sql`
            CREATE TABLE IF NOT EXISTS stock_sourcing_requests (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              product_name varchar(255) NOT NULL,
              preferred_brand varchar(255),
              contact_name varchar(255),
              contact_phone varchar(50),
              contact_email varchar(255),
              status varchar(50) DEFAULT 'open',
              assigned_staff varchar(100) DEFAULT 'Unassigned',
              admin_notes text,
              created_at timestamp with time zone DEFAULT now()
            );
          `;

          const stockRequests = await sql`
            SELECT id, product_name, preferred_brand, contact_name, contact_phone, contact_email, status, assigned_staff, admin_notes, created_at
            FROM stock_sourcing_requests
            ORDER BY created_at DESC
          `;

          const allInquiries: any[] = [];

          // Map stock_sourcing_requests
          stockRequests.forEach((sr: any, idx: number) => {
            allInquiries.push({
              id: sr.id,
              sourceTable: "stock_sourcing_requests",
              ticketNo: `SRC-400${idx + 1}`,
              customerName: sr.contact_name || "Farmer Client",
              customerEmail: sr.contact_email || "farmer@mkulima.co.ke",
              customerPhone: sr.contact_phone || "+254 723 346 134",
              title: `Stock Request: ${sr.product_name}`,
              category: "Stock Sourcing Request",
              priority: "high",
              status: sr.status || "open",
              assignedStaff: sr.assigned_staff || "Unassigned",
              adminNotes: sr.admin_notes || "",
              createdAt: sr.created_at ? new Date(sr.created_at).toISOString() : new Date().toISOString(),
              messages: [
                {
                  id: `msg-sr-${sr.id}`,
                  sender: "customer",
                  senderName: sr.contact_name || "Farmer Client",
                  text: `Requested Product: ${sr.product_name}\nPreferred Brand / Volume: ${sr.preferred_brand || "Any brand/volume"}\n\nClient Note:\nLooking for this product through the Mqulima agro-sourcing network.`,
                  timestamp: sr.created_at ? new Date(sr.created_at).toLocaleString() : "Recent",
                },
              ],
            });
          });

          // Map contact_submissions
          contacts.forEach((c: any, idx: number) => {
            let phone = "+254 723 346 134";
            let subject = "General Contact Inquiry";
            let cleanMsg = c.message || "";

            const phoneMatch = cleanMsg.match(/Phone:\s*([^\n]+)/);
            if (phoneMatch) phone = phoneMatch[1].trim();

            const subjMatch = cleanMsg.match(/Subject:\s*([^\n]+)/);
            if (subjMatch) subject = subjMatch[1].trim();

            allInquiries.push({
              id: c.id,
              sourceTable: "contact_submissions",
              ticketNo: `TICK-100${idx + 1}`,
              customerName: c.name || "Client",
              customerEmail: c.email || "client@mkulima.co.ke",
              customerPhone: phone,
              title: subject,
              category: "General Contact",
              priority: idx === 0 ? "high" : "medium",
              status: c.status || "open",
              assignedStaff: c.assigned_staff || "Unassigned",
              adminNotes: c.admin_notes || "",
              createdAt: c.created_at ? new Date(c.created_at).toISOString() : new Date().toISOString(),
              messages: [
                {
                  id: `msg-${c.id}`,
                  sender: "customer",
                  senderName: c.name || "Client",
                  text: cleanMsg,
                  timestamp: c.created_at ? new Date(c.created_at).toLocaleString() : "Recent",
                },
              ],
            });
          });

          // Map partnership_applications
          partnerships.forEach((p: any, idx: number) => {
            const details = typeof p.details === "string" ? JSON.parse(p.details || "{}") : (p.details || {});
            const contactName = details.contact_name || "Partnership Lead";
            const phone = details.phone || "+254 723 346 134";
            const goal = details.goal || "Partnership Proposal";

            allInquiries.push({
              id: p.id,
              sourceTable: "partnership_applications",
              ticketNo: `PART-200${idx + 1}`,
              customerName: `${contactName} (${p.org_name || "Organization"})`,
              customerEmail: p.contact_email || "partner@mkulima.co.ke",
              customerPhone: phone,
              title: `Partnership: ${p.org_name || "Strategic Collaboration"}`,
              category: "Partnership Application",
              priority: "high",
              status: p.status || "open",
              assignedStaff: p.assigned_staff || "Unassigned",
              adminNotes: p.admin_notes || "",
              createdAt: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
              messages: [
                {
                  id: `msg-p-${p.id}`,
                  sender: "customer",
                  senderName: contactName,
                  text: `Organization: ${p.org_name}\nRole: ${details.role || "Executive"}\nType: ${details.org_type || "Commercial"}\n\nProposal Goal:\n${goal}`,
                  timestamp: p.created_at ? new Date(p.created_at).toLocaleString() : "Recent",
                },
              ],
            });
          });

          // Map service_requests
          services.forEach((s: any, idx: number) => {
            allInquiries.push({
              id: s.id,
              sourceTable: "service_requests",
              ticketNo: s.reference || `SERV-300${idx + 1}`,
              customerName: s.contact_name || "Farmer Client",
              customerEmail: "farmer@mkulima.co.ke",
              customerPhone: s.contact_phone || "+254 723 346 134",
              title: `${s.subservice_name || "Agronomy Service"} Advisory`,
              category: "Service Request",
              priority: "medium",
              status: s.status || "open",
              assignedStaff: "Agron-Lead",
              adminNotes: "",
              createdAt: s.created_at ? new Date(s.created_at).toISOString() : new Date().toISOString(),
              messages: [
                {
                  id: `msg-s-${s.id}`,
                  sender: "customer",
                  senderName: s.contact_name || "Farmer Client",
                  text: s.notes || `Booking for ${s.subservice_name || "agronomy inspection"} in ${s.location || "Kenya"}.`,
                  timestamp: s.created_at ? new Date(s.created_at).toLocaleString() : "Recent",
                },
              ],
            });
          });

          return new Response(JSON.stringify({ success: true, inquiries: allInquiries }), {
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
          const { id, sourceTable, status, assignedStaff, adminNotes, actorId = "admin-desk" } = body;

          const sql = getDb();

          if (sourceTable === "contact_submissions") {
            await sql`
              UPDATE contact_submissions
              SET status = ${status || 'open'},
                  assigned_staff = ${assignedStaff || 'Unassigned'},
                  admin_notes = ${adminNotes || ''}
              WHERE id = ${id}
            `;
          } else if (sourceTable === "partnership_applications") {
            await sql`
              UPDATE partnership_applications
              SET status = ${status || 'open'},
                  assigned_staff = ${assignedStaff || 'Unassigned'},
                  admin_notes = ${adminNotes || ''}
              WHERE id = ${id}
            `;
          } else if (sourceTable === "service_requests") {
            await sql`
              UPDATE service_requests
              SET status = ${status || 'open'}
              WHERE id = ${id}
            `;
          } else if (sourceTable === "stock_sourcing_requests") {
            await sql`
              UPDATE stock_sourcing_requests
              SET status = ${status || 'open'},
                  assigned_staff = ${assignedStaff || 'Unassigned'},
                  admin_notes = ${adminNotes || ''}
              WHERE id = ${id}
            `;
          }

          await logAdminAction({
            actorId,
            action: `UPDATE_INQUIRY_TICKET`,
            entity: "inquiries",
            entityId: String(id),
            diff: { status, assignedStaff, adminNotes },
          });

          return new Response(JSON.stringify({ success: true, message: "Ticket updated successfully" }), {
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
