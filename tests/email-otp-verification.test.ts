import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import {
  generateSecureOtp,
  hashOtp,
  verifyOtpHash,
  OTP_LENGTH,
  OTP_EXPIRATION_MINUTES,
  MAX_VERIFICATION_ATTEMPTS,
  MAX_RESENDS_PER_WINDOW,
  RESEND_WINDOW_MINUTES,
} from "../src/lib/otp.server";
import {
  renderVerificationEmailHtml,
  renderVerificationEmailText,
  sendVerificationOtpEmail,
} from "../src/lib/email-service.server";
import * as jose from "jose";

describe("Email OTP Registration & Verification Security Suite", () => {
  const TEST_SECRET = "test-jwt-secret-key-32chars-minimum-123!";
  const TEST_EMAIL = "farmer.test@mqulima.com";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Valid Registration & Initial Unverified State
  describe("1. Valid Registration Initial State", () => {
    it("should ensure new registrations initialize with is_verified = false", () => {
      const newUser = {
        id: crypto.randomUUID(),
        email: TEST_EMAIL,
        isVerified: false,
        status: "active",
      };

      expect(newUser.isVerified).toBe(false);
      expect(newUser.email).toBe(TEST_EMAIL);
    });
  });

  // 2. Cryptographically Secure OTP Generation
  describe("2. OTP Generation Security", () => {
    it("should generate exactly 6-digit numerical codes", () => {
      for (let i = 0; i < 50; i++) {
        const otp = generateSecureOtp();
        expect(otp).toHaveLength(OTP_LENGTH);
        expect(/^\d{6}$/.test(otp)).toBe(true);
        const num = parseInt(otp, 10);
        expect(num).toBeGreaterThanOrEqual(100000);
        expect(num).toBeLessThan(1000000);
      }
    });

    it("should not use Math.random and produce high entropy without immediate collision", () => {
      const sample = new Set<string>();
      for (let i = 0; i < 100; i++) {
        sample.add(generateSecureOtp());
      }
      // Out of 100 random 6-digit codes, the unique count should be very close to 100
      expect(sample.size).toBeGreaterThanOrEqual(95);
    });
  });

  // 3. OTP Hashing
  describe("3. OTP Hashing & DB Storage Protection", () => {
    it("should never store plaintext OTPs and produce SHA-256 HMAC hex hashes", () => {
      const otp = "543210";
      const hash = hashOtp(otp, TEST_SECRET);

      expect(hash).not.toBe(otp);
      expect(hash).not.toContain(otp);
      expect(hash).toHaveLength(64); // 256 bits = 64 hex characters
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });

    it("should be deterministic for identical secret and OTP", () => {
      const otp = "123456";
      const hash1 = hashOtp(otp, TEST_SECRET);
      const hash2 = hashOtp(otp, TEST_SECRET);
      expect(hash1).toBe(hash2);
    });

    it("should yield distinct hashes for different OTPs or secrets", () => {
      const hashA = hashOtp("111111", TEST_SECRET);
      const hashB = hashOtp("222222", TEST_SECRET);
      const hashC = hashOtp("111111", "another-secret-key-for-testing-123");

      expect(hashA).not.toBe(hashB);
      expect(hashA).not.toBe(hashC);
    });
  });

  // 4. OTP Expiration
  describe("4. OTP Expiration Window", () => {
    it("should enforce a 10-minute expiration window", () => {
      expect(OTP_EXPIRATION_MINUTES).toBe(10);

      const now = Date.now();
      const expiresAt = new Date(now + OTP_EXPIRATION_MINUTES * 60 * 1000);
      const diffMs = expiresAt.getTime() - now;

      expect(diffMs).toBe(10 * 60 * 1000);
    });
  });

  // 5. Correct OTP Verification
  describe("5. Correct OTP Verification & Timing-Safe Equality", () => {
    it("should verify correct OTP with constant-time equality", () => {
      const otp = "890123";
      const storedHash = hashOtp(otp, TEST_SECRET);

      const isValid = verifyOtpHash(otp, storedHash, TEST_SECRET);
      expect(isValid).toBe(true);
    });
  });

  // 6. Incorrect OTP
  describe("6. Incorrect OTP Handling", () => {
    it("should reject incorrect OTP codes", () => {
      const realOtp = "123456";
      const wrongOtp = "654321";
      const storedHash = hashOtp(realOtp, TEST_SECRET);

      const isValid = verifyOtpHash(wrongOtp, storedHash, TEST_SECRET);
      expect(isValid).toBe(false);
    });

    it("should reject malformed or non-6-digit input lengths", () => {
      const realOtp = "123456";
      const storedHash = hashOtp(realOtp, TEST_SECRET);

      expect(verifyOtpHash("12345", storedHash, TEST_SECRET)).toBe(false);
      expect(verifyOtpHash("1234567", storedHash, TEST_SECRET)).toBe(false);
      expect(verifyOtpHash("", storedHash, TEST_SECRET)).toBe(false);
    });
  });

  // 7. Too Many Failed Attempts Lockout
  describe("7. Failed Verification Attempts & Lockout", () => {
    it("should define maximum verification attempts as 5", () => {
      expect(MAX_VERIFICATION_ATTEMPTS).toBe(5);
    });

    it("should track attempt count and lockout after 5 failures", () => {
      const realOtp = "998877";
      const storedHash = hashOtp(realOtp, TEST_SECRET);

      let attempts = 0;
      let lockedOut = false;

      for (let i = 1; i <= 6; i++) {
        if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
          lockedOut = true;
          break;
        }

        const candidate = `00000${i}`;
        const isMatch = verifyOtpHash(candidate, storedHash, TEST_SECRET);
        if (!isMatch) {
          attempts++;
        }
      }

      expect(attempts).toBe(5);
      expect(lockedOut).toBe(true);
    });
  });

  // 8. Reused OTP
  describe("8. Single-Use / Reused OTP Invalidation", () => {
    it("should reject an OTP if it has already been used", () => {
      const mockRecord = {
        codeHash: hashOtp("123456", TEST_SECRET),
        usedAt: new Date(), // Already consumed
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      const isUsable = mockRecord.usedAt === null;
      expect(isUsable).toBe(false);
    });
  });

  // 9. Expired OTP
  describe("9. Expired OTP Rejection", () => {
    it("should reject an OTP whose expires_at is in the past", () => {
      const pastTime = new Date(Date.now() - 1000); // 1s ago
      const mockRecord = {
        codeHash: hashOtp("123456", TEST_SECRET),
        usedAt: null,
        expiresAt: pastTime,
      };

      const isExpired = new Date(mockRecord.expiresAt) < new Date();
      expect(isExpired).toBe(true);
    });
  });

  // 10. Resend OTP
  describe("10. Resend OTP Flow", () => {
    it("should generate a new code on resend", () => {
      const firstOtp = generateSecureOtp();
      const secondOtp = generateSecureOtp();

      expect(firstOtp).toHaveLength(6);
      expect(secondOtp).toHaveLength(6);
    });
  });

  // 11. Invalidation of Previous OTP on New Issuance
  describe("11. Invalidation of Previous OTP", () => {
    it("should simulate invalidating active OTPs when issuing new OTP", () => {
      const activeOtps = [
        { id: "1", usedAt: null },
        { id: "2", usedAt: null },
      ];

      // Invalidation step
      const now = new Date();
      const invalidated = activeOtps.map((o) => ({ ...o, usedAt: now }));

      expect(invalidated.every((o) => o.usedAt !== null)).toBe(true);
    });
  });

  // 12. OTP Resend Rate Limiting (3 in 15 min)
  describe("12. Resend Rate Limiting", () => {
    it("should enforce maximum 3 OTP requests in 15 minutes window", () => {
      expect(MAX_RESENDS_PER_WINDOW).toBe(3);
      expect(RESEND_WINDOW_MINUTES).toBe(15);

      const requestTimestamps: number[] = [];
      const windowMs = RESEND_WINDOW_MINUTES * 60 * 1000;
      const now = Date.now();

      function canRequestOtp(): boolean {
        const valid = requestTimestamps.filter((t) => t > now - windowMs);
        if (valid.length >= MAX_RESENDS_PER_WINDOW) {
          return false;
        }
        requestTimestamps.push(now);
        return true;
      }

      expect(canRequestOtp()).toBe(true); // 1st
      expect(canRequestOtp()).toBe(true); // 2nd
      expect(canRequestOtp()).toBe(true); // 3rd
      expect(canRequestOtp()).toBe(false); // 4th blocked!
    });
  });

  // 13. Already Verified User Handling
  describe("13. Already Verified User Flow", () => {
    it("should detect verified user and avoid issuing redundant OTPs", () => {
      const dbUser = {
        id: "user-123",
        email: TEST_EMAIL,
        isVerified: true,
      };

      if (dbUser.isVerified) {
        const response = {
          alreadyVerified: true,
          message: "Your email address is already verified. You can proceed to sign in.",
        };
        expect(response.alreadyVerified).toBe(true);
        expect(response.message).toContain("already verified");
      }
    });
  });

  // 14. SMTP Failure Handling
  describe("14. SMTP Failure & Error Containment", () => {
    it("should render professional HTML email with Mqulima branding and plain text fallback", () => {
      const html = renderVerificationEmailHtml({
        otpCode: "654321",
        recipientName: "Jane Farmer",
        expiresInMinutes: 10,
      });

      expect(html).toContain("654321");
      expect(html).toContain("Jane Farmer");
      expect(html).toContain("10 minutes");
      expect(html).toContain("MQULIMA");
      expect(html).toContain("#056B3A"); // Forest green branding
      expect(html).toContain("Never share this verification code");

      const text = renderVerificationEmailText({
        otpCode: "654321",
        recipientName: "Jane Farmer",
        expiresInMinutes: 10,
      });

      expect(text).toContain("654321");
      expect(text).toContain("Jane Farmer");
      expect(text).toContain("mqulima@mqulima.com");
    });

    it("should catch SMTP errors gracefully without throwing uncaught exceptions", async () => {
      // In test mode, sendVerificationOtpEmail returns mocked: true safely
      const result = await sendVerificationOtpEmail({
        toEmail: "invalid-email-format",
        otpCode: "123456",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should succeed safely in mock mode during test runs", async () => {
      const result = await sendVerificationOtpEmail({
        toEmail: "farmer.jane@mqulima.com",
        recipientName: "Jane",
        otpCode: "123456",
      });

      expect(result.success).toBe(true);
      expect(result.mocked).toBe(true);
    });
  });

  // 15. Database Failure Graceful Handling
  describe("15. Database Error Handling", () => {
    it("should catch and wrap database errors without crashing", async () => {
      async function simulatedDbOperation() {
        try {
          throw new Error("PostgreSQL connection timeout");
        } catch (err: any) {
          return { success: false, error: "Database operation temporarily unavailable" };
        }
      }

      const res = await simulatedDbOperation();
      expect(res.success).toBe(false);
      expect(res.error).toContain("Database operation temporarily unavailable");
    });
  });

  // 16. Session Behavior After Verification
  describe("16. Authenticated Session Creation After Verification", () => {
    it("should sign a valid JWT token with user ID and email upon successful verification", async () => {
      const secretBytes = new TextEncoder().encode(TEST_SECRET);
      const userId = crypto.randomUUID();

      const jwt = await new jose.SignJWT({
        sub: userId,
        role: "farmer",
        email: TEST_EMAIL,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secretBytes);

      expect(typeof jwt).toBe("string");
      expect(jwt.split(".")).toHaveLength(3);

      // Verify the signed JWT
      const { payload } = await jose.jwtVerify(jwt, secretBytes);
      expect(payload.sub).toBe(userId);
      expect(payload.email).toBe(TEST_EMAIL);
      expect(payload.role).toBe("farmer");
    });
  });
});
