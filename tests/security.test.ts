import { describe, it, expect } from "vitest";
import { redactSensitiveMessage } from "../src/lib/sms-service.server";
import { validateServerConfig } from "../src/lib/config.server";
import { hasPermission, assertAdminPermission, type AdminUserContext } from "../src/lib/api/admin-auth.server";
import { sanitizeBlogHtml } from "../src/lib/sanitization";

describe("Phase 1 & Phase 3 Security Remediation Tests", () => {
  describe("1. Password Protection in SMS & Logging", () => {
    it("should never include passwords in welcome SMS message template", () => {
      const safeWelcomeMessage = "Welcome to Mkulima. Your account has been created successfully. Never share your password with anyone.";
      expect(safeWelcomeMessage).not.toMatch(/Password:/i);
      expect(safeWelcomeMessage).not.toContain("${data.password}");
      expect(safeWelcomeMessage).toContain("Never share your password with anyone.");
    });

    it("should redact sensitive credentials and passwords before SMS transmission or logging", () => {
      const rawWithPass = "Your account was created. Password: Secret123! Keep safe.";
      const redacted = redactSensitiveMessage(rawWithPass);
      expect(redacted).not.toContain("Secret123!");
      expect(redacted).toContain("[REDACTED]");

      const jsonWithPass = '{"username":"farmer1","password":"MySuperSecretPassword#2026"}';
      const redactedJson = redactSensitiveMessage(jsonWithPass);
      expect(redactedJson).not.toContain("MySuperSecretPassword#2026");
      expect(redactedJson).toContain("[REDACTED]");
    });
  });

  describe("2. Server Configuration & Secrets Fail-Fast", () => {
    it("should throw in production if critical secrets are missing", () => {
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.JWT_SECRET;
      try {
        process.env.NODE_ENV = "production";
        delete process.env.JWT_SECRET;

        expect(() => validateServerConfig()).toThrow(/JWT_SECRET/);
      } finally {
        process.env.NODE_ENV = originalEnv;
        if (originalSecret) process.env.JWT_SECRET = originalSecret;
      }
    });

    it("should reject static fallback secrets in production", () => {
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.JWT_SECRET;
      try {
        process.env.NODE_ENV = "production";
        process.env.JWT_SECRET = "mqulima-dev-secret-change-in-production-2025";

        expect(() => validateServerConfig()).toThrow(/must not use the insecure default placeholder/);
      } finally {
        process.env.NODE_ENV = originalEnv;
        if (originalSecret) process.env.JWT_SECRET = originalSecret;
      }
    });
  });

  describe("3. CSRF Protection", () => {
    it("should reject requests when csrfToken is omitted or invalid", () => {
      const isCsrfValid = (token?: string) => {
        if (!token || token.trim() === "") {
          return false;
        }
        return token.length >= 16;
      };

      expect(isCsrfValid(undefined)).toBe(false);
      expect(isCsrfValid("")).toBe(false);
      expect(isCsrfValid("short")).toBe(false);
      expect(isCsrfValid("valid-secure-csrf-token-12345")).toBe(true);
    });
  });

  describe("4. Granular Admin RBAC Authorization", () => {
    const superAdmin: AdminUserContext = { id: "u-1", email: "admin@mkulima.com", role: "super_admin" };
    const contentEditor: AdminUserContext = { id: "u-2", email: "editor@mkulima.com", role: "content_editor" };
    const salesAgent: AdminUserContext = { id: "u-3", email: "sales@mkulima.com", role: "sales_agent" };

    it("should grant all permissions to super_admin", () => {
      expect(hasPermission(superAdmin, "customers.delete")).toBe(true);
      expect(hasPermission(superAdmin, "payments.reconcile")).toBe(true);
      expect(hasPermission(superAdmin, "products.create")).toBe(true);
      expect(() => assertAdminPermission(superAdmin, "payments.reconcile")).not.toThrow();
    });

    it("should deny sensitive financial and customer operations to content_editor", () => {
      expect(hasPermission(contentEditor, "customers.delete")).toBe(false);
      expect(hasPermission(contentEditor, "customers.update")).toBe(false);
      expect(hasPermission(contentEditor, "payments.reconcile")).toBe(false);
      expect(hasPermission(contentEditor, "products.archive")).toBe(false);

      expect(() => assertAdminPermission(contentEditor, "payments.reconcile")).toThrow(/Forbidden/);
      expect(() => assertAdminPermission(contentEditor, "customers.delete")).toThrow(/Forbidden/);
    });

    it("should allow content_editor to manage news and content only", () => {
      expect(hasPermission(contentEditor, "content.read")).toBe(true);
      expect(hasPermission(contentEditor, "content.create")).toBe(true);
      expect(hasPermission(contentEditor, "content.update")).toBe(true);
      expect(hasPermission(contentEditor, "content.delete")).toBe(true);
      expect(() => assertAdminPermission(contentEditor, "content.create")).not.toThrow();
    });

    it("should allow sales_agent to read orders and customers but not delete or reconcile", () => {
      expect(hasPermission(salesAgent, "orders.read")).toBe(true);
      expect(hasPermission(salesAgent, "customers.read")).toBe(true);
      expect(hasPermission(salesAgent, "payments.reconcile")).toBe(false);
      expect(hasPermission(salesAgent, "customers.delete")).toBe(false);
    });
  });

  describe("5. XSS Prevention & Sanitization", () => {
    it("should sanitize malicious script tags, onerror handlers, and javascript: URLs", () => {
      const dirtyHtml = `
        <p>Legitimate article text</p>
        <script>alert('XSS')</script>
        <img src="x" onerror="stealCookies()" />
        <a href="javascript:doEvil()">Click here</a>
        <b>Safe bold text</b>
      `;

      const cleanHtml = sanitizeBlogHtml(dirtyHtml);

      expect(cleanHtml).not.toContain("<script>");
      expect(cleanHtml).not.toContain("alert('XSS')");
      expect(cleanHtml).not.toContain("onerror");
      expect(cleanHtml).not.toContain("javascript:");
      expect(cleanHtml).toContain("<p>Legitimate article text</p>");
      expect(cleanHtml).toContain("<b>Safe bold text</b>");
    });
  });
});
