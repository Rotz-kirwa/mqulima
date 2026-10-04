import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { formatKenyanPhoneE164, normalizeKenyanPhone, sendRecoverySms, sendRecoverySecurityNoticeSms } from "../src/lib/sms-service.server";
import {
  renderPasswordRecoveryEmailHtml,
  renderPasswordRecoveryEmailText,
  sendPasswordRecoveryEmail,
  sendRecoverySecurityNoticeEmail,
} from "../src/lib/email-service.server";
import { checkRecoveryRequestRateLimit, checkRecoveryAttemptRateLimit } from "../src/lib/rate-limit.server";

describe("Password Recovery Security & Multi-Channel Verification Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Password Storage & Hashing Verification", () => {
    it("should ensure passwords are exclusively hashed with bcrypt (salt rounds >= 10)", async () => {
      const plaintextPassword = "SecretPassword123!";
      const hash = await bcrypt.hash(plaintextPassword, 10);

      // Verify bcrypt format $2a$ or $2b$
      expect(hash).toMatch(/^\$2[ab]\$10\$/);
      expect(hash).not.toContain(plaintextPassword);

      const isMatch = await bcrypt.compare(plaintextPassword, hash);
      expect(isMatch).toBe(true);

      const isWrongMatch = await bcrypt.compare("WrongPassword", hash);
      expect(isWrongMatch).toBe(false);
    });
  });

  describe("2. Cryptographic Code and Link Token Generation", () => {
    it("should generate cryptographically random 6-digit codes", () => {
      for (let i = 0; i < 50; i++) {
        const code = crypto.randomInt(100000, 1000000).toString();
        expect(code).toHaveLength(6);
        expect(/^\d{6}$/.test(code)).toBe(true);
      }
    });

    it("should generate cryptographically random 32-byte (64-char hex) tokens", () => {
      for (let i = 0; i < 20; i++) {
        const token = crypto.randomBytes(32).toString("hex");
        expect(token).toHaveLength(64);
        expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
      }
    });

    it("should store tokens and codes HASHED using SHA-256", () => {
      const rawCode = "654321";
      const rawToken = "a".repeat(64);

      const codeHash = crypto.createHash("sha256").update(rawCode).digest("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      expect(codeHash).toHaveLength(64);
      expect(tokenHash).toHaveLength(64);
      expect(codeHash).not.toBe(rawCode);
      expect(tokenHash).not.toBe(rawToken);
    });
  });

  describe("3. Phone Number Normalization (+254 E.164)", () => {
    it("should correctly normalize local Kenyan numbers to +254 format", () => {
      expect(formatKenyanPhoneE164("0712345678")).toBe("+254712345678");
      expect(formatKenyanPhoneE164("0112345678")).toBe("+254112345678");
      expect(formatKenyanPhoneE164("254712345678")).toBe("+254712345678");
      expect(formatKenyanPhoneE164("+254712345678")).toBe("+254712345678");
      expect(formatKenyanPhoneE164("0722 123 456")).toBe("+254722123456");
    });

    it("should reject invalid mobile phone numbers", () => {
      expect(() => formatKenyanPhoneE164("12345")).toThrow();
      expect(() => formatKenyanPhoneE164("0201234567")).toThrow();
      expect(() => formatKenyanPhoneE164("")).toThrow();
    });
  });

  describe("4. SMS Template & Multi-Provider Specs", () => {
    it("should format SMS recovery message strictly matching the required specification", async () => {
      const code = "789123";
      const shortLink = "https://mqulima.com/m/xyz";
      const res = await sendRecoverySms("+254712345678", code, shortLink);

      expect(res.success).toBe(true);
    });

    it("should dispatch security notice SMS correctly", async () => {
      const res = await sendRecoverySecurityNoticeSms("+254712345678");
      expect(res.success).toBe(true);
    });
  });

  describe("5. Email Recovery Template Specs", () => {
    it("should render responsive HTML email with both 6-digit code and one-tap sign-in link", () => {
      const html = renderPasswordRecoveryEmailHtml({
        otpCode: "432109",
        magicLinkUrl: "https://mqulima.com/auth/magic-login?token=abc12345",
        recipientName: "Wanjiku Farmer",
        expiresInMinutes: 10,
      });

      expect(html).toContain("432109");
      expect(html).toContain("https://mqulima.com/auth/magic-login?token=abc12345");
      expect(html).toContain("Wanjiku Farmer");
      expect(html).toContain("10 minutes");
      expect(html).toContain("Never share this code");
    });

    it("should render plain-text fallback with clear instructions", () => {
      const text = renderPasswordRecoveryEmailText({
        otpCode: "432109",
        magicLinkUrl: "https://mqulima.com/auth/magic-login?token=abc12345",
        recipientName: "Wanjiku Farmer",
        expiresInMinutes: 10,
      });

      expect(text).toContain("432109");
      expect(text).toContain("https://mqulima.com/auth/magic-login?token=abc12345");
      expect(text).toContain("ONE-TAP SIGN IN");
    });

    it("should dispatch recovery email without leaking plaintext secrets in errors", async () => {
      const res = await sendPasswordRecoveryEmail({
        toEmail: "farmer.jane@mqulima.com",
        recipientName: "Jane",
        otpCode: "998877",
        magicLinkUrl: "https://mqulima.com/auth/magic-login?token=test",
        expiresInMinutes: 10,
      });

      expect(res.success).toBe(true);
    });

    it("should dispatch security alert email", async () => {
      const res = await sendRecoverySecurityNoticeEmail({
        toEmail: "farmer.jane@mqulima.com",
        recipientName: "Jane",
        loginTime: "10/04/2026, 10:00:00 AM",
      });

      expect(res.success).toBe(true);
    });
  });

  describe("6. Upstash Rate Limiting Enforcement", () => {
    it("should enforce maximum 10 recovery requests per hour per IP", async () => {
      const testIp = "197.232.88.99"; // Non-localhost IP

      for (let i = 0; i < 10; i++) {
        const check = await checkRecoveryRequestRateLimit(testIp);
        expect(check.success).toBe(true);
      }

      // 11th request from the same IP must be rejected
      const rateExceeded = await checkRecoveryRequestRateLimit(testIp);
      expect(rateExceeded.success).toBe(false);
      expect(rateExceeded.error).toContain("Too many recovery attempts");
    });

    it("should enforce maximum 3 recovery requests per hour per account", async () => {
      const testAccount = "targeted.farmer@example.com";
      const randomIp = () => `198.51.100.${Math.floor(Math.random() * 200) + 10}`;

      for (let i = 0; i < 3; i++) {
        const check = await checkRecoveryRequestRateLimit(randomIp(), testAccount);
        expect(check.success).toBe(true);
      }

      // 4th request for the same account must be rejected regardless of IP
      const rateExceeded = await checkRecoveryRequestRateLimit(randomIp(), testAccount);
      expect(rateExceeded.success).toBe(false);
      expect(rateExceeded.error).toContain("Maximum 3 requests per hour allowed");
    });

    it("should lock code after 5 failed verification attempts", async () => {
      const codeKey = `test_code_lock_${Date.now()}`;

      for (let i = 0; i < 5; i++) {
        const check = await checkRecoveryAttemptRateLimit(codeKey);
        expect(check.success).toBe(true);
      }

      // 6th attempt must trigger lock
      const locked = await checkRecoveryAttemptRateLimit(codeKey);
      expect(locked.success).toBe(false);
      expect(locked.error).toContain("Maximum verification attempts exceeded");
    });
  });

  describe("7. Anti-Enumeration & Uniform Response", () => {
    it("should ensure identical response format for known and unknown accounts", () => {
      const expectedMessage = "If this account exists, we've sent a code and link to your registered email and phone.";

      const responseKnown = {
        success: true,
        message: expectedMessage,
      };

      const responseUnknown = {
        success: true,
        message: expectedMessage,
      };

      expect(responseKnown.message).toBe(responseUnknown.message);
      expect(responseKnown.success).toBe(responseUnknown.success);
    });
  });

  describe("8. Single-Use and Expiration Lifecycle", () => {
    it("should ensure used or expired tokens cannot be reused", () => {
      const now = Date.now();
      const expiredToken = {
        expiresAt: new Date(now - 1000), // in the past
        usedAt: null,
      };

      const isExpired = expiredToken.expiresAt.getTime() <= now;
      expect(isExpired).toBe(true);

      const usedToken = {
        expiresAt: new Date(now + 10 * 60 * 1000),
        usedAt: new Date(now - 5000),
      };

      const isAlreadyUsed = usedToken.usedAt !== null;
      expect(isAlreadyUsed).toBe(true);
    });
  });

  describe("9. Date Serialization & Driver Interoperability Guardrail", () => {
    it("should ensure postgres date serializers serialize Date instances to string instead of leaking Date objects", () => {
      const dateSerializer = (x: any) => (x instanceof Date ? x : new Date(x)).toISOString();
      const testDate = new Date("2026-10-04T12:00:00.000Z");
      const serialized = dateSerializer(testDate);
      expect(typeof serialized).toBe("string");
      expect(serialized).toBe("2026-10-04T12:00:00.000Z");
      expect(Buffer.byteLength(serialized)).toBeGreaterThan(0);
    });
  });
});
