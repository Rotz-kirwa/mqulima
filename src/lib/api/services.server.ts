import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CreateBookingSchema, executeServiceBooking } from "./services-core.server";

export const createServiceBooking = createServerFn({ method: "POST" })
  .inputValidator(CreateBookingSchema)
  .handler(async ({ data }) => {
    return executeServiceBooking(data);
  });

export const createWhatsAppServiceRequest = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      service_type: z.string().min(1),
      subservice_name: z.string().optional(),
      contact_name: z.string().optional(),
      contact_phone: z.string().optional(),
      county: z.string().optional(),
      location: z.string().optional(),
      farm_scale: z.string().optional(),
      notes: z.string().optional(),
      csrfToken: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const fullLocation = [data.location, data.county].filter(Boolean).join(", ") || "Farm location";
    return executeServiceBooking({
      service_type: data.service_type,
      subservice_name: data.subservice_name,
      contact_name: data.contact_name,
      contact_phone: data.contact_phone,
      location: fullLocation,
      farm_scale: data.farm_scale || "Quote Basis",
      scheduled_date: new Date().toISOString(),
      notes: data.notes || `WhatsApp quotation request for ${data.subservice_name || data.service_type}`,
      channel: "whatsapp",
      csrfToken: data.csrfToken,
    });
  });

export const getServiceCategoriesWithServices = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("../db.server");
  const sql = getDb();
  const categories = await sql`
    SELECT id, name, slug, description, icon
    FROM service_categories
    ORDER BY name ASC
  `;
  const services = await sql`
    SELECT id, category_id, name, slug, description, price_type, base_price::float as base_price
    FROM services
    ORDER BY name ASC
  `;
  return {
    categories,
    services,
  };
});
