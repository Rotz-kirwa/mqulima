import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CreateBookingSchema = z.object({
  service_type: z.string(),
  farmer_id: z.string().uuid(),
  location: z.string(),
  farm_size_acres: z.number().positive(),
  scheduled_date: z.string(),
  notes: z.string().optional(),
  amount: z.number().optional(),
  csrfToken: z.string()
});

function generateReference() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ref = "";
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MQ-${ref}`;
}

export const createServiceBooking = createServerFn({ method: "POST" })
  .inputValidator(CreateBookingSchema)
  .handler(async ({ data }) => {
    const { service_type, farmer_id, location, farm_size_acres, scheduled_date, notes, amount, csrfToken } = data;

    // 1. CSRF Token Validation
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(csrfToken);

    // Check authentication
    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user || user.id !== farmer_id) {
      throw new Error("Unauthorized");
    }

    const { getDb } = await import("../db.server");
    const sql = getDb();

    // Map service_type (e.g. subservice.id) to services.slug in DB
    let serviceSlug = "soil-ph-npk-analysis";
    const st = service_type.toLowerCase();
    if (st.includes("soil")) {
      serviceSlug = "soil-ph-npk-analysis";
    } else if (st.includes("vet") || st.includes("ai") || st.includes("vaccin") || st.includes("breed")) {
      serviceSlug = "emergency-vet-visit";
    } else if (st.includes("silage") || st.includes("feed") || st.includes("shred")) {
      serviceSlug = "silage-shredding";
    } else {
      const match = await sql`SELECT slug FROM services WHERE slug LIKE ${"%" + service_type + "%"} LIMIT 1`;
      if (match.length > 0) {
        serviceSlug = match[0].slug;
      }
    }

    const serviceRes = await sql`
      SELECT id, name FROM services WHERE slug = ${serviceSlug} LIMIT 1
    `;
    if (serviceRes.length === 0) {
      throw new Error(`Service not found for slug: ${serviceSlug}`);
    }
    const serviceId = serviceRes[0].id;
    const serviceName = serviceRes[0].name || "Service Request";
    const reference = generateReference();

    // Insert service request
    const insertRes = await sql`
      INSERT INTO service_requests (user_id, service_id, status, notes, scheduled_date, location, reference)
      VALUES (${farmer_id}, ${serviceId}, 'requested', ${notes || null}, ${scheduled_date}, ${location}, ${reference})
      RETURNING id
    `;

    const bookingId = insertRes[0].id;
    const finalAmount = amount || 1500; // fallback if amount is missing

    // Create corresponding order record to satisfy payments relationship
    const orderItemsJson = [{ id: serviceId, name: serviceName, price: finalAmount, quantity: 1 }];
    const [orderRes] = await sql`
      INSERT INTO orders (user_id, items, subtotal, total, status, payment_method, payment_status, notes, checkout_channel)
      VALUES (${farmer_id}, ${sql.json(orderItemsJson)}, ${finalAmount}, ${finalAmount}, 'pending', 'mpesa', 'pending', ${`Service Booking Ref: ${reference}`}, 'website')
      RETURNING id
    `;
    const orderId = orderRes.id;

    // 2. Write Audit Log
    const { writeAuditLog } = await import("../audit.server");
    await writeAuditLog({
      actorId: farmer_id,
      action: "service.created",
      entityType: "service_request",
      entityId: bookingId,
      diff: { reference, serviceSlug, location, farm_size_acres, orderId }
    });

    return {
      success: true,
      reference,
      bookingId,
      orderId
    };
  });
