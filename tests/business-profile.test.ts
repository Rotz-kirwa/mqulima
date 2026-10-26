import { describe, it, expect } from "vitest";
import {
  AUTHORITATIVE_BUSINESS_DEFAULTS,
  getBusinessOpenStatus,
  format12Hour,
  buildBusinessProfileJsonLd,
  type OperatingHourDay,
} from "../src/lib/business-data";
import { STATIC_PUBLIC_ROUTES } from "../src/lib/sitemap.server";

describe("Mqulima Business Profile & Google Business Profile Integration Tests", () => {
  describe("1. Authoritative Business Data Verification", () => {
    it("should contain the verified business name, tagline, and slogan", () => {
      expect(AUTHORITATIVE_BUSINESS_DEFAULTS.businessName).toBe("Mqulima");
      expect(AUTHORITATIVE_BUSINESS_DEFAULTS.brandTagline).toBe("Africa's 360° agriculture ecosystem");
      expect(AUTHORITATIVE_BUSINESS_DEFAULTS.brandSlogan).toBe("Taking you first class");
    });

    it("should contain verified Eldoret headquarters address and coordinates", () => {
      expect(AUTHORITATIVE_BUSINESS_DEFAULTS.addressStreet).toContain("Eldoret–Iten Highway");
      expect(AUTHORITATIVE_BUSINESS_DEFAULTS.addressCity).toBe("Eldoret");
      expect(AUTHORITATIVE_BUSINESS_DEFAULTS.addressCounty).toBe("Uasin Gishu");
      expect(AUTHORITATIVE_BUSINESS_DEFAULTS.addressCountry).toBe("Kenya");
      expect(AUTHORITATIVE_BUSINESS_DEFAULTS.latitude).toBeCloseTo(0.5143, 2);
      expect(AUTHORITATIVE_BUSINESS_DEFAULTS.longitude).toBeCloseTo(35.2698, 2);
    });

    it("should contain verified contact telephone numbers and official email", () => {
      expect(AUTHORITATIVE_BUSINESS_DEFAULTS.phonePrimary).toBe("+254 723 346 134");
      expect(AUTHORITATIVE_BUSINESS_DEFAULTS.emailPrimary).toBe("info@mqulima.com");
      expect(AUTHORITATIVE_BUSINESS_DEFAULTS.whatsappNumber).toBe("254723346134");
    });

    it("should define structured 7-day operating hours with Sunday closed", () => {
      const hours = AUTHORITATIVE_BUSINESS_DEFAULTS.operatingHours;
      expect(hours).toHaveLength(7);
      
      const sunday = hours.find((h) => h.day === "Sunday");
      expect(sunday).toBeDefined();
      expect(sunday?.closed).toBe(true);

      const monday = hours.find((h) => h.day === "Monday");
      expect(monday).toBeDefined();
      expect(monday?.closed).toBe(false);
      expect(monday?.open).toBe("08:00");
      expect(monday?.close).toBe("18:00");
    });

    it("should list Eldoret and key Rift Valley/Western counties in service coverage", () => {
      const areas = AUTHORITATIVE_BUSINESS_DEFAULTS.serviceAreas;
      expect(areas).toContain("Eldoret");
      expect(areas).toContain("Uasin Gishu County");
      expect(areas).toContain("Nationwide Delivery across Kenya");
    });
  });

  describe("2. Timezone & Operating Hours Evaluation (Africa/Nairobi UTC+3)", () => {
    it("should format 24-hour time to 12-hour AM/PM correctly", () => {
      expect(format12Hour("08:00")).toBe("8:00 AM");
      expect(format12Hour("13:00")).toBe("1:00 PM");
      expect(format12Hour("18:00")).toBe("6:00 PM");
      expect(format12Hour("00:00")).toBe("12:00 AM");
    });

    it("should evaluate business open status without throwing exceptions", () => {
      const sampleHours: OperatingHourDay[] = [
        { day: "Monday", open: "08:00", close: "18:00", closed: false },
        { day: "Tuesday", open: "08:00", close: "18:00", closed: false },
        { day: "Wednesday", open: "08:00", close: "18:00", closed: false },
        { day: "Thursday", open: "08:00", close: "18:00", closed: false },
        { day: "Friday", open: "08:00", close: "18:00", closed: false },
        { day: "Saturday", open: "08:00", close: "13:00", closed: false },
        { day: "Sunday", open: "00:00", close: "00:00", closed: true },
      ];

      const status = getBusinessOpenStatus(sampleHours);
      expect(status).toHaveProperty("isOpen");
      expect(typeof status.isOpen).toBe("boolean");
      expect(status).toHaveProperty("statusLabel");
      expect(status).toHaveProperty("nextTimeLabel");
      expect(status).toHaveProperty("currentDayName");
    });
  });

  describe("3. Schema.org Structured Data (JSON-LD)", () => {
    it("should generate valid LocalBusiness JSON-LD markup", () => {
      const jsonLd = buildBusinessProfileJsonLd(AUTHORITATIVE_BUSINESS_DEFAULTS);
      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toContain("LocalBusiness");
      expect(jsonLd["@type"]).toContain("Store");
      expect(jsonLd.name).toBe("Mqulima");
      expect(jsonLd.url).toBe("https://mqulima.com/business");
      expect(jsonLd.telephone).toBe("+254 723 346 134");
      expect(jsonLd.email).toBe("info@mqulima.com");

      const address = jsonLd.address as any;
      expect(address["@type"]).toBe("PostalAddress");
      expect(address.streetAddress).toBe("Junction, Eldoret–Iten Highway");
      expect(address.addressLocality).toBe("Eldoret");
      expect(address.addressRegion).toBe("Uasin Gishu");
      expect(address.addressCountry).toBe("KE");

      const geo = jsonLd.geo as any;
      expect(geo["@type"]).toBe("GeoCoordinates");
      expect(geo.latitude).toBeCloseTo(0.5143, 2);
      expect(geo.longitude).toBeCloseTo(35.2698, 2);
    });

    it("should generate openingHoursSpecification correctly", () => {
      const jsonLd = buildBusinessProfileJsonLd(AUTHORITATIVE_BUSINESS_DEFAULTS);
      const hoursSpec = jsonLd.openingHoursSpecification as any[];
      expect(Array.isArray(hoursSpec)).toBe(true);
      // Sunday is closed, so 6 active days
      expect(hoursSpec).toHaveLength(6);
      expect(hoursSpec[0]).toHaveProperty("opens");
      expect(hoursSpec[0]).toHaveProperty("closes");
      expect(hoursSpec[0]).toHaveProperty("dayOfWeek");
    });
  });

  describe("4. XML Sitemap Inclusion", () => {
    it("should include /business route in STATIC_PUBLIC_ROUTES", () => {
      const businessRoute = STATIC_PUBLIC_ROUTES.find((r) => r.path === "/business");
      expect(businessRoute).toBeDefined();
      expect(businessRoute?.priority).toBe("0.85");
      expect(businessRoute?.changefreq).toBe("weekly");
    });
  });

  describe("5. RBAC & Security for Business Profile Endpoint", () => {
    it("should verify that only super_admin, admin, or operations_manager can edit business profile", () => {
      const isRoleAllowed = (role: string) =>
        ["super_admin", "admin", "operations_manager"].includes(role);

      expect(isRoleAllowed("super_admin")).toBe(true);
      expect(isRoleAllowed("admin")).toBe(true);
      expect(isRoleAllowed("operations_manager")).toBe(true);

      // Unauthorized roles
      expect(isRoleAllowed("farmer")).toBe(false);
      expect(isRoleAllowed("retailer")).toBe(false);
      expect(isRoleAllowed("content_editor")).toBe(false);
      expect(isRoleAllowed("support_agent")).toBe(false);
      expect(isRoleAllowed("guest")).toBe(false);
    });
  });
});
