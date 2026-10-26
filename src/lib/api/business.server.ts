import { createServerFn } from "@tanstack/react-start";
import { AUTHORITATIVE_BUSINESS_DEFAULTS, type BusinessProfileData } from "../business-data";

let cachedProfile: { data: BusinessProfileData; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute in-memory cache

export function invalidateBusinessProfileCache(): void {
  cachedProfile = null;
}

export const getBusinessProfile = createServerFn({ method: "GET" }).handler(
  async (): Promise<BusinessProfileData> => {
    const now = Date.now();
    if (cachedProfile && cachedProfile.expiresAt > now) {
      return cachedProfile.data;
    }

    try {
      const { getDrizzleDb } = await import("../db.server");
      const { businessProfile } = await import("../../db/schema/business");
      const { eq } = await import("drizzle-orm");

      const db = getDrizzleDb();
      const rows = await db
        .select()
        .from(businessProfile)
        .where(eq(businessProfile.id, "default"))
        .limit(1);

      if (rows.length > 0) {
        const row = rows[0];
        const merged: BusinessProfileData = {
          id: row.id,
          businessName: row.businessName || AUTHORITATIVE_BUSINESS_DEFAULTS.businessName,
          legalName: row.legalName || AUTHORITATIVE_BUSINESS_DEFAULTS.legalName,
          brandTagline: row.brandTagline || AUTHORITATIVE_BUSINESS_DEFAULTS.brandTagline,
          brandSlogan: row.brandSlogan || AUTHORITATIVE_BUSINESS_DEFAULTS.brandSlogan,
          primaryCategory: row.primaryCategory || AUTHORITATIVE_BUSINESS_DEFAULTS.primaryCategory,
          shortDescription: row.shortDescription || AUTHORITATIVE_BUSINESS_DEFAULTS.shortDescription,
          fullOverview: row.fullOverview || AUTHORITATIVE_BUSINESS_DEFAULTS.fullOverview,
          phonePrimary: row.phonePrimary || AUTHORITATIVE_BUSINESS_DEFAULTS.phonePrimary,
          phoneSecondary: row.phoneSecondary || AUTHORITATIVE_BUSINESS_DEFAULTS.phoneSecondary,
          emailPrimary: row.emailPrimary || AUTHORITATIVE_BUSINESS_DEFAULTS.emailPrimary,
          emailSupport: row.emailSupport || AUTHORITATIVE_BUSINESS_DEFAULTS.emailSupport,
          whatsappNumber: row.whatsappNumber || AUTHORITATIVE_BUSINESS_DEFAULTS.whatsappNumber,
          addressStreet: row.addressStreet || AUTHORITATIVE_BUSINESS_DEFAULTS.addressStreet,
          addressCity: row.addressCity || AUTHORITATIVE_BUSINESS_DEFAULTS.addressCity,
          addressCounty: row.addressCounty || AUTHORITATIVE_BUSINESS_DEFAULTS.addressCounty,
          addressPostalCode: row.addressPostalCode || AUTHORITATIVE_BUSINESS_DEFAULTS.addressPostalCode,
          addressCountry: row.addressCountry || AUTHORITATIVE_BUSINESS_DEFAULTS.addressCountry,
          latitude: Number(row.latitude) || AUTHORITATIVE_BUSINESS_DEFAULTS.latitude,
          longitude: Number(row.longitude) || AUTHORITATIVE_BUSINESS_DEFAULTS.longitude,
          mapsUrl: row.mapsUrl || AUTHORITATIVE_BUSINESS_DEFAULTS.mapsUrl,
          serviceAreas: (row.serviceAreas && row.serviceAreas.length > 0) ? row.serviceAreas : AUTHORITATIVE_BUSINESS_DEFAULTS.serviceAreas,
          operatingHours: (row.operatingHours && Array.isArray(row.operatingHours) && row.operatingHours.length > 0)
            ? (row.operatingHours as any)
            : AUTHORITATIVE_BUSINESS_DEFAULTS.operatingHours,
          logoUrl: row.logoUrl || AUTHORITATIVE_BUSINESS_DEFAULTS.logoUrl,
          coverImageUrl: row.coverImageUrl || AUTHORITATIVE_BUSINESS_DEFAULTS.coverImageUrl,
          galleryImages: (row.galleryImages && row.galleryImages.length > 0)
            ? row.galleryImages
            : AUTHORITATIVE_BUSINESS_DEFAULTS.galleryImages,
          socialLinks: (row.socialLinks && typeof row.socialLinks === "object")
            ? (row.socialLinks as any)
            : AUTHORITATIVE_BUSINESS_DEFAULTS.socialLinks,
          faqs: (row.faqs && Array.isArray(row.faqs) && row.faqs.length > 0)
            ? (row.faqs as any)
            : AUTHORITATIVE_BUSINESS_DEFAULTS.faqs,
          businessPolicies: (row.businessPolicies && typeof row.businessPolicies === "object")
            ? (row.businessPolicies as any)
            : AUTHORITATIVE_BUSINESS_DEFAULTS.businessPolicies,
          googlePlaceId: row.googlePlaceId || "",
          googleReviewUrl: row.googleReviewUrl || AUTHORITATIVE_BUSINESS_DEFAULTS.googleReviewUrl,
          isPublished: row.isPublished ?? true,
          updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
        };

        cachedProfile = { data: merged, expiresAt: now + CACHE_TTL_MS };
        return merged;
      }
    } catch (err) {
      console.warn("[BUSINESS_SERVER_FN] Failed to fetch from database, using authoritative defaults:", err);
    }

    cachedProfile = { data: AUTHORITATIVE_BUSINESS_DEFAULTS, expiresAt: now + CACHE_TTL_MS };
    return AUTHORITATIVE_BUSINESS_DEFAULTS;
  }
);
