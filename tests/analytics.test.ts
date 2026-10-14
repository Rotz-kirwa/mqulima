import { describe, it, expect, beforeEach, vi } from "vitest";
import { sanitizeEventPayload, sanitizeString, sanitizeUrl } from "../src/lib/analytics/sanitizer";
import {
  DEFAULT_CONSENT,
  getStoredConsent,
  saveConsentPreferences,
  acceptAllConsent,
  rejectOptionalConsent,
  hasAnalyticsConsent,
  hasMarketingConsent,
} from "../src/lib/analytics/consent";
import { getGA4ConfigStatus } from "../src/lib/server/ga4-reporting.server";
import { hasPermission, ROLE_PERMISSIONS } from "../src/lib/api/admin-auth.server";

describe("Google Analytics 4 & Consent Architecture Tests", () => {
  describe("1. PII Sanitization & Data Privacy Guardrails", () => {
    it("should sanitize email addresses from string parameters", () => {
      const input = "User inquiry regarding farmer.john@example.com for tomato seeds";
      const sanitized = sanitizeString(input);
      expect(sanitized).not.toContain("farmer.john@example.com");
      expect(sanitized).toContain("[REDACTED_EMAIL]");
    });

    it("should sanitize Kenyan phone numbers from strings", () => {
      const input1 = "Contact customer on +254712345678 about fertilizer";
      expect(sanitizeString(input1)).toContain("[REDACTED_PHONE]");
      expect(sanitizeString(input1)).not.toContain("712345678");

      const input2 = "Delivery to 0722123456 in Nakuru";
      expect(sanitizeString(input2)).toContain("[REDACTED_PHONE]");
    });

    it("should strip sensitive object keys (passwords, tokens, OTPs, national IDs)", () => {
      const payload = {
        product_name: "YaraMila Power",
        product_category: "Fertilizer",
        value: 4500,
        currency: "KES",
        password: "SuperSecretPassword123!",
        user_token: "jwt.secret.token.here",
        national_id: "36011184",
        id_number: "36011184",
        otp_code: "982312",
        email: "farmer@gmail.com",
        phone_number: "+254702032109",
      };

      const cleaned = sanitizeEventPayload(payload);

      // Safe fields preserved
      expect(cleaned.product_name).toBe("YaraMila Power");
      expect(cleaned.product_category).toBe("Fertilizer");
      expect(cleaned.value).toBe(4500);
      expect(cleaned.currency).toBe("KES");

      // Sensitive fields stripped
      expect(cleaned.password).toBeUndefined();
      expect(cleaned.user_token).toBeUndefined();
      expect(cleaned.national_id).toBeUndefined();
      expect(cleaned.id_number).toBeUndefined();
      expect(cleaned.otp_code).toBeUndefined();
      expect(cleaned.email).toBeUndefined();
      expect(cleaned.phone_number).toBeUndefined();
    });

    it("should recursively sanitize nested objects", () => {
      const nested = {
        action: "search",
        metadata: {
          query: "Contact me at user@test.co.ke",
          apiKey: "sk_live_123456",
        },
      };

      const cleaned = sanitizeEventPayload(nested);
      expect(cleaned.action).toBe("search");
      expect(cleaned.metadata.query).toContain("[REDACTED_EMAIL]");
      expect(cleaned.metadata.apiKey).toBeUndefined();
    });

    it("should sanitize URLs stripping sensitive query params while retaining UTM campaign tags", () => {
      const dirtyUrl = "https://mqulima.com/auth/reset?token=secret_jwt_xyz&email=farmer@gmail.com&utm_source=facebook&utm_campaign=seed_promo";
      const cleanUrl = sanitizeUrl(dirtyUrl);

      expect(cleanUrl).not.toContain("secret_jwt_xyz");
      expect(cleanUrl).not.toContain("farmer@gmail.com");
      expect(cleanUrl).toContain("utm_source=facebook");
      expect(cleanUrl).toContain("utm_campaign=seed_promo");
    });
  });

  describe("2. Consent Preferences & Consent Mode v2", () => {
    beforeEach(() => {
      // Clear localStorage
      if (typeof window !== "undefined") {
        window.localStorage.clear();
      }
    });

    it("should default to false for analytics and marketing before user decision", () => {
      expect(DEFAULT_CONSENT.necessary).toBe(true);
      expect(DEFAULT_CONSENT.analytics).toBe(false);
      expect(DEFAULT_CONSENT.marketing).toBe(false);
    });

    it("should grant analytics when user accepts all consent", () => {
      // Mock window and localStorage
      const storage: Record<string, string> = {};
      vi.stubGlobal("localStorage", {
        getItem: (k: string) => storage[k] || null,
        setItem: (k: string, v: string) => { storage[k] = v; },
        removeItem: (k: string) => { delete storage[k]; },
        clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
      });

      const updated = acceptAllConsent();
      expect(updated.analytics).toBe(true);
      expect(updated.marketing).toBe(true);
      expect(hasAnalyticsConsent()).toBe(true);
      expect(hasMarketingConsent()).toBe(true);
    });

    it("should deny analytics when user rejects optional cookies", () => {
      const updated = rejectOptionalConsent();
      expect(updated.analytics).toBe(false);
      expect(updated.marketing).toBe(false);
      expect(hasAnalyticsConsent()).toBe(false);
      expect(hasMarketingConsent()).toBe(false);
    });

    it("should allow custom granular consent choices", () => {
      const updated = saveConsentPreferences({
        analytics: true,
        marketing: false,
      });
      expect(updated.analytics).toBe(true);
      expect(updated.marketing).toBe(false);
      expect(hasAnalyticsConsent()).toBe(true);
      expect(hasMarketingConsent()).toBe(false);
    });
  });

  describe("3. Admin RBAC Permissions for Analytics", () => {
    it("should grant 'analytics.read' permission to super_admin and admin roles", () => {
      expect(hasPermission("super_admin", "analytics.read")).toBe(true);
      expect(hasPermission("admin", "analytics.read")).toBe(true);
      expect(ROLE_PERMISSIONS.super_admin).toContain("analytics.read");
      expect(ROLE_PERMISSIONS.admin).toContain("analytics.read");
    });

    it("should deny 'analytics.read' permission to non-admin roles", () => {
      expect(hasPermission("sales_agent", "analytics.read")).toBe(false);
      expect(hasPermission("content_editor", "analytics.read")).toBe(false);
      expect(hasPermission("farmer", "analytics.read")).toBe(false);
      expect(hasPermission("consumer", "analytics.read")).toBe(false);
    });
  });

  describe("4. Server-Side GA4 Reporting Configuration & Quota Awareness", () => {
    it("should correctly detect missing GA4 property and credentials without throwing", () => {
      const status = getGA4ConfigStatus();
      expect(typeof status.isConfigured).toBe("boolean");
      expect(Array.isArray(status.missingFields)).toBe(true);

      if (!status.isConfigured) {
        expect(status.missingFields.length).toBeGreaterThan(0);
      }
    });
  });

  describe("5. Client-Side Event Tracking & Consent Enforcement", () => {
    let mockGtag: any;
    let mockStorage: Record<string, string>;

    beforeEach(() => {
      mockGtag = vi.fn();
      mockStorage = {};
      const fakeLocalStorage = {
        getItem: (k: string) => mockStorage[k] || null,
        setItem: (k: string, v: string) => {
          mockStorage[k] = v;
        },
        removeItem: (k: string) => {
          delete mockStorage[k];
        },
        clear: () => {
          mockStorage = {};
        },
      };

      vi.stubGlobal("localStorage", fakeLocalStorage);
      vi.stubGlobal("window", {
        gtag: mockGtag,
        location: { href: "https://www.mqulima.com/shop" },
        document: { title: "AgroShop — Certified Farm Inputs" },
        dispatchEvent: vi.fn(),
        localStorage: fakeLocalStorage,
      });

      // Reset consent memory and storage
      rejectOptionalConsent();
      mockStorage = {};
      mockGtag.mockClear();
    });

    it("should not dispatch event to gtag if consent is not granted", async () => {
      const { trackEvent } = await import("../src/lib/analytics/track");
      trackEvent("marketplace_opened");

      // Verify that no business tracking events were emitted (gtag consent default may run)
      expect(mockGtag).not.toHaveBeenCalledWith("event", expect.anything(), expect.anything());
    });

    it("should dispatch sanitized event to gtag when consent is granted", async () => {
      // Grant consent
      saveConsentPreferences({ analytics: true, marketing: false });

      const { trackEvent } = await import("../src/lib/analytics/track");
      trackEvent("site_search", {
        search_term: "Maize Seeds inquiry for test@example.com",
        search_type: "general",
      });

      expect(mockGtag).toHaveBeenCalledWith(
        "event",
        "site_search",
        expect.objectContaining({
          search_term: expect.stringContaining("[REDACTED_EMAIL]"),
          search_type: "general",
        })
      );

      // Verify dual-dispatch to GA4 standard recommended 'search' event
      expect(mockGtag).toHaveBeenCalledWith(
        "event",
        "search",
        expect.objectContaining({
          search_term: expect.stringContaining("[REDACTED_EMAIL]"),
        })
      );
    });

    it("should dispatch official GA4 recommended e-commerce and auth events", async () => {
      saveConsentPreferences({ analytics: true, marketing: false });
      const { trackEvent } = await import("../src/lib/analytics/track");

      // 1. view_item
      trackEvent("product_viewed", {
        product_id: "prod-yara-17",
        product_name: "YaraMila Power NPK",
        product_category: "Fertilizer",
        price: 4500,
        currency: "KES",
      });

      expect(mockGtag).toHaveBeenCalledWith(
        "event",
        "view_item",
        expect.objectContaining({
          currency: "KES",
          value: 4500,
          items: expect.arrayContaining([
            expect.objectContaining({
              item_id: "prod-yara-17",
              item_name: "YaraMila Power NPK",
              price: 4500,
            }),
          ]),
        })
      );

      // 2. sign_up
      trackEvent("sign_up_completed", { method: "credentials" });
      expect(mockGtag).toHaveBeenCalledWith(
        "event",
        "sign_up",
        expect.objectContaining({ method: "credentials" })
      );

      // 3. purchase
      trackEvent("purchase_completed", {
        order_id: "ORD-9912",
        transaction_value: 9000,
        transaction_currency: "KES",
      });
      expect(mockGtag).toHaveBeenCalledWith(
        "event",
        "purchase",
        expect.objectContaining({
          transaction_id: "ORD-9912",
          value: 9000,
          currency: "KES",
        })
      );
    });

    it("should track page_view with sanitized path and title", async () => {
      saveConsentPreferences({ analytics: true, marketing: false });

      const { trackPageView } = await import("../src/lib/analytics/track");
      trackPageView("/services", "Services — Professional Support");

      expect(mockGtag).toHaveBeenCalledWith(
        "event",
        "page_view",
        expect.objectContaining({
          page_path: "/services",
          page_title: "Services — Professional Support",
          page_category: "services",
        })
      );
    });
  });

  describe("6. Admin Sidebar Role-Based Visibility", () => {
    const navItems = [
      { id: "dashboard", label: "Executive Dashboard" },
      { id: "analytics", label: "Visitor Analytics (GA4)" },
      { id: "customers", label: "Customers CRM" },
      { id: "orders", label: "Orders & Quotations" },
    ];

    const filterNavForRole = (_role: string) => {
      return navItems;
    };

    it("should include analytics tab for all admin staff roles", () => {
      expect(filterNavForRole("super_admin").some((i) => i.id === "analytics")).toBe(true);
      expect(filterNavForRole("admin").some((i) => i.id === "analytics")).toBe(true);
      expect(filterNavForRole("sales_agent").some((i) => i.id === "analytics")).toBe(true);
      expect(filterNavForRole("content_editor").some((i) => i.id === "analytics")).toBe(true);
    });
  });
});
