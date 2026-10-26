import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getDrizzleDb } from "@/lib/db.server";
import { businessProfile } from "@/db/schema/business";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";
import { logAdminAction } from "@/lib/audit.server";
import { invalidateBusinessProfileCache } from "@/lib/api/business.server";
import { AUTHORITATIVE_BUSINESS_DEFAULTS } from "@/lib/business-data";

const OperatingHourDaySchema = z.object({
  day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
  open: z.string().min(1),
  close: z.string().min(1),
  closed: z.boolean(),
});

const BusinessProfileUpdateSchema = z.object({
  businessName: z.string().min(1).max(255).optional(),
  legalName: z.string().max(255).optional(),
  brandTagline: z.string().max(255).optional(),
  brandSlogan: z.string().max(255).optional(),
  primaryCategory: z.string().min(1).max(150).optional(),
  shortDescription: z.string().min(1).optional(),
  fullOverview: z.string().min(1).optional(),
  phonePrimary: z.string().min(1).max(50).optional(),
  phoneSecondary: z.string().max(50).optional().nullable(),
  emailPrimary: z.string().email().optional(),
  emailSupport: z.string().email().optional(),
  whatsappNumber: z.string().min(1).max(50).optional(),
  addressStreet: z.string().min(1).max(255).optional(),
  addressCity: z.string().min(1).max(100).optional(),
  addressCounty: z.string().min(1).max(100).optional(),
  addressPostalCode: z.string().max(50).optional(),
  addressCountry: z.string().max(100).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  mapsUrl: z.string().url().optional(),
  serviceAreas: z.array(z.string()).optional(),
  operatingHours: z.array(OperatingHourDaySchema).optional(),
  logoUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
  galleryImages: z.array(z.string()).optional(),
  socialLinks: z.record(z.string()).optional(),
  faqs: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).optional(),
  businessPolicies: z.object({
    delivery: z.string().optional(),
    payments: z.string().optional(),
    returns: z.string().optional(),
    warranty: z.string().optional(),
  }).optional(),
  googlePlaceId: z.string().optional().nullable(),
  googleReviewUrl: z.string().url().optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const Route = createFileRoute("/api/admin/business-profile")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;

        try {
          const db = getDrizzleDb();
          const rows = await db
            .select()
            .from(businessProfile)
            .where(eq(businessProfile.id, "default"))
            .limit(1);

          const profile = rows.length > 0 ? rows[0] : AUTHORITATIVE_BUSINESS_DEFAULTS;

          return new Response(JSON.stringify({ success: true, profile }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          });
        } catch (err: any) {
          console.error("[ADMIN_BUSINESS_PROFILE] GET error:", err);
          return new Response(
            JSON.stringify({ success: false, error: err.message || "Failed to fetch business profile" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },

      PUT: async ({ request }: { request: Request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;

        const role = auth.user.role;
        const isAuthorizedRole = ["super_admin", "admin", "operations_manager"].includes(role);
        if (!isAuthorizedRole) {
          return new Response(
            JSON.stringify({ success: false, error: "Forbidden. Administrative role required to modify business profile." }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        try {
          const body = await request.json();
          const parsed = BusinessProfileUpdateSchema.safeParse(body);

          if (!parsed.success) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Validation failed",
                details: parsed.error.flatten().fieldErrors,
              }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const db = getDrizzleDb();
          const data = parsed.data;

          const updatePayload: Record<string, any> = {
            updatedAt: new Date(),
            updatedBy: auth.user.email || auth.user.id,
          };

          if (data.businessName !== undefined) updatePayload.businessName = data.businessName;
          if (data.legalName !== undefined) updatePayload.legalName = data.legalName;
          if (data.brandTagline !== undefined) updatePayload.brandTagline = data.brandTagline;
          if (data.brandSlogan !== undefined) updatePayload.brandSlogan = data.brandSlogan;
          if (data.primaryCategory !== undefined) updatePayload.primaryCategory = data.primaryCategory;
          if (data.shortDescription !== undefined) updatePayload.shortDescription = data.shortDescription;
          if (data.fullOverview !== undefined) updatePayload.fullOverview = data.fullOverview;
          if (data.phonePrimary !== undefined) updatePayload.phonePrimary = data.phonePrimary;
          if (data.phoneSecondary !== undefined) updatePayload.phoneSecondary = data.phoneSecondary;
          if (data.emailPrimary !== undefined) updatePayload.emailPrimary = data.emailPrimary;
          if (data.emailSupport !== undefined) updatePayload.emailSupport = data.emailSupport;
          if (data.whatsappNumber !== undefined) updatePayload.whatsappNumber = data.whatsappNumber;
          if (data.addressStreet !== undefined) updatePayload.addressStreet = data.addressStreet;
          if (data.addressCity !== undefined) updatePayload.addressCity = data.addressCity;
          if (data.addressCounty !== undefined) updatePayload.addressCounty = data.addressCounty;
          if (data.addressPostalCode !== undefined) updatePayload.addressPostalCode = data.addressPostalCode;
          if (data.addressCountry !== undefined) updatePayload.addressCountry = data.addressCountry;
          if (data.latitude !== undefined) updatePayload.latitude = data.latitude.toString();
          if (data.longitude !== undefined) updatePayload.longitude = data.longitude.toString();
          if (data.mapsUrl !== undefined) updatePayload.mapsUrl = data.mapsUrl;
          if (data.serviceAreas !== undefined) updatePayload.serviceAreas = data.serviceAreas;
          if (data.operatingHours !== undefined) updatePayload.operatingHours = data.operatingHours;
          if (data.logoUrl !== undefined) updatePayload.logoUrl = data.logoUrl;
          if (data.coverImageUrl !== undefined) updatePayload.coverImageUrl = data.coverImageUrl;
          if (data.galleryImages !== undefined) updatePayload.galleryImages = data.galleryImages;
          if (data.socialLinks !== undefined) updatePayload.socialLinks = data.socialLinks;
          if (data.faqs !== undefined) updatePayload.faqs = data.faqs;
          if (data.businessPolicies !== undefined) updatePayload.businessPolicies = data.businessPolicies;
          if (data.googlePlaceId !== undefined) updatePayload.googlePlaceId = data.googlePlaceId;
          if (data.googleReviewUrl !== undefined) updatePayload.googleReviewUrl = data.googleReviewUrl;
          if (data.isPublished !== undefined) updatePayload.isPublished = data.isPublished;

          await db
            .insert(businessProfile)
            .values({ id: "default", ...updatePayload })
            .onConflictDoUpdate({
              target: businessProfile.id,
              set: updatePayload,
            });

          // Invalidate cache
          invalidateBusinessProfileCache();

          // Log audit
          try {
            await logAdminAction({
              actorId: auth.user.id,
              action: "update_business_profile",
              entityType: "business_profile",
              entityId: "default",
              diff: { updatedFields: Object.keys(data) },
            });
          } catch (auditErr) {
            console.warn("[ADMIN_BUSINESS_PROFILE] Audit logging failed non-fatally:", auditErr);
          }

          const updatedRows = await db
            .select()
            .from(businessProfile)
            .where(eq(businessProfile.id, "default"))
            .limit(1);

          return new Response(
            JSON.stringify({ success: true, profile: updatedRows[0] }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (err: any) {
          console.error("[ADMIN_BUSINESS_PROFILE] PUT error:", err);
          return new Response(
            JSON.stringify({ success: false, error: err.message || "Failed to update business profile" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
