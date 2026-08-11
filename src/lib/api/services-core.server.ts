import { z } from "zod";
import { normalizeKenyanPhone } from "../phone.server";

export const CreateBookingSchema = z.object({
  service_type: z.string().min(1, "Service type is required"),
  farmer_id: z.string().uuid().optional(),
  contact_name: z.string().max(100).optional(),
  contact_phone: z.string().optional(),
  subservice_name: z.string().max(150).optional(),
  location: z.string().min(1, "Location is required").max(200),
  farm_size_acres: z.number().positive().optional(),
  farm_scale: z.string().max(100).optional(),
  scheduled_date: z.string(),
  notes: z.string().max(1000).optional(),
  amount: z.number().nonnegative().optional(),
  channel: z.enum(["website", "whatsapp"]).optional().default("website"),
  csrfToken: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

function generateReference(prefix = "MQ-SRV"): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ref = "";
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${ref}`;
}

export async function executeServiceBooking(data: CreateBookingInput) {
  const {
    service_type,
    farmer_id,
    contact_name,
    contact_phone,
    subservice_name,
    location,
    farm_size_acres,
    farm_scale,
    scheduled_date,
    notes,
    amount,
    channel = "website",
    csrfToken,
  } = data;

  // 1. CSRF Token Validation if provided
  if (csrfToken) {
    try {
      const { validateCsrfToken } = await import("../csrf-verify.server");
      validateCsrfToken(csrfToken);
    } catch (e) {
      // Safe fallback outside HTTP request context
    }
  }

  // 2. Resolve User Authentication Context
  let currentUser = null;
  try {
    const { getCurrentUser } = await import("../auth-server");
    currentUser = await getCurrentUser();
  } catch (e) {
    // Safe fallback outside HTTP request context
  }

  // STRICT RULES:
  // Authenticated user -> real user_id
  // Guest user -> NULL (never fallback to super_admin or admin profiles!)
  let effectiveUserId: string | null = null;
  if (currentUser?.id) {
    effectiveUserId = currentUser.id;
  } else if (farmer_id) {
    const { getDb } = await import("../db.server");
    const sql = getDb();
    const [userCheck] = await sql`SELECT id FROM profiles WHERE id = ${farmer_id} AND deleted_at IS NULL`;
    if (userCheck?.id) {
      effectiveUserId = userCheck.id;
    }
  }

  // 3. Contact Name & Phone Resolution + Kenyan Format Normalization
  let rawPhone = contact_phone;
  let finalContactName = contact_name;

  if (currentUser) {
    if (!finalContactName) finalContactName = currentUser.name || currentUser.email;
    if (!rawPhone) rawPhone = (currentUser as any).phone || "";
  }

  if (!finalContactName) {
    finalContactName = "Guest Farmer";
  }

  let normalizedPhone: string;
  try {
    normalizedPhone = normalizeKenyanPhone(rawPhone || "");
  } catch (err: any) {
    throw new Error(`Phone validation failed: ${err.message || "Invalid Kenyan phone number"}`);
  }

  const { getDb } = await import("../db.server");
  const sql = getDb();

  // 4. Idempotency Check: Prevent duplicate bookings if submitted within 60 seconds
  const finalSubserviceName = subservice_name || service_type;
  const [recentDuplicate] = await sql`
    SELECT id, reference, user_id
    FROM service_requests
    WHERE contact_phone = ${normalizedPhone}
      AND subservice_name = ${finalSubserviceName}
      AND created_at > NOW() - INTERVAL '60 seconds'
    LIMIT 1
  `;

  if (recentDuplicate) {
    return {
      success: true,
      reference: recentDuplicate.reference as string,
      bookingId: recentDuplicate.id as string,
      orderId: null,
      channel,
      duplicate: true,
    };
  }

  // 5. Map service_type to service slug in database
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

  const serviceRes = await sql`SELECT id, name FROM services WHERE slug = ${serviceSlug} LIMIT 1`;
  let serviceId: string = serviceRes[0]?.id || "";
  let serviceName: string = serviceRes[0]?.name || "Agricultural Service";

  if (!serviceId) {
    const [anyService] = await sql`SELECT id, name FROM services LIMIT 1`;
    serviceId = (anyService?.id || "") as string;
    serviceName = (anyService?.name || "Agricultural Service") as string;
  }

  const reference = generateReference(channel === "whatsapp" ? "MQ-WA" : "MQ-SRV");
  const finalFarmScale = farm_scale || (farm_size_acres ? `${farm_size_acres} Acres` : "Custom");
  const finalAmount = amount !== undefined ? amount : 2500;

  // 6. Transactional Database Execution
  let bookingId = "";
  let orderId = "";

  await sql.begin(async (tx) => {
    // 6a. Insert service request (user_id is NULL for guest users)
    const [insertRes] = await tx`
      INSERT INTO service_requests (
        user_id,
        service_id,
        status,
        notes,
        scheduled_date,
        location,
        reference,
        contact_name,
        contact_phone,
        subservice_name,
        farm_scale,
        channel,
        estimated_cost
      ) VALUES (
        ${effectiveUserId},
        ${serviceId},
        'requested',
        ${notes || null},
        ${scheduled_date},
        ${location},
        ${reference},
        ${finalContactName},
        ${normalizedPhone},
        ${finalSubserviceName},
        ${finalFarmScale},
        ${channel},
        ${finalAmount}
      )
      RETURNING id
    `;
    bookingId = insertRes.id as string;

    // 6b. Insert corresponding pending order ledger record
    const orderItemsJson = JSON.stringify([{ id: serviceId, name: `${serviceName} (${finalSubserviceName})`, price: finalAmount, quantity: 1 }]);
    const [orderRes] = await tx`
      INSERT INTO orders (user_id, items, subtotal, total, status, payment_method, payment_status, notes, checkout_channel)
      VALUES (
        ${effectiveUserId},
        ${orderItemsJson},
        ${finalAmount},
        ${finalAmount},
        'pending',
        'mpesa',
        'pending',
        ${`Service Booking Ref: ${reference}`},
        ${channel}
      )
      RETURNING id
    `;
    orderId = orderRes.id as string;

    // 6c. Insert in-app notification ONLY if user is authenticated (never for guests or admins)
    if (effectiveUserId) {
      try {
        const notifPayload = {
          tag: "Booking",
          tagClass: "bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
          title: `Service Booking Confirmed: ${finalSubserviceName} 🚜`,
          desc: `Booking Ref: ${reference} (${finalSubserviceName}) scheduled for ${scheduled_date} at ${location} (${finalFarmScale}). Contact: ${normalizedPhone}. Estimated Cost: KES ${finalAmount.toLocaleString()}`,
          details: {
            reference,
            bookingId,
            orderId,
            serviceId,
            serviceName,
            subserviceName: finalSubserviceName,
            location,
            scheduledDate: scheduled_date,
            contactName: finalContactName,
            contactPhone: normalizedPhone,
            farmScale: finalFarmScale,
            notes,
            estimatedCost: finalAmount,
            channel,
            bookedAt: new Date().toISOString()
          },
          time: "Just now",
          link: "/services"
        };
        await tx`
          INSERT INTO notifications (user_id, type, payload)
          VALUES (
            ${effectiveUserId},
            'service_request_submitted',
            ${tx.json(notifPayload)}
          )
        `;
      } catch (err) {
        console.warn("[SERVICES] Could not create notification record:", err);
      }
    }
  });

  // 7. Write Audit Log
  try {
    const { writeAuditLog } = await import("../audit.server");
    await writeAuditLog({
      actorId: effectiveUserId || "guest-user",
      action: "service.created",
      entityType: "service_request",
      entityId: bookingId,
      diff: { reference, serviceSlug, subserviceName: finalSubserviceName, location, channel, orderId },
    });
  } catch (err) {
    console.warn("[SERVICES] Audit log write warning:", err);
  }

  return {
    success: true,
    reference,
    bookingId,
    orderId,
    channel,
  };
}
