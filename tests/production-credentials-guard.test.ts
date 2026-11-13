import { describe, it, expect, vi, afterEach } from "vitest";
import crypto from "node:crypto";

const originalEnv = { ...process.env };

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("../src/lib/config.server");
  vi.doUnmock("../src/lib/db.server");
  process.env = { ...originalEnv };
});

describe("Production Credentials Fail-Closed Guardrails", () => {
  it("fails closed when PAYSTACK_SECRET_KEY is missing instead of using hardcoded keys", async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    vi.resetModules();
    vi.doMock("../src/lib/config.server", () => ({
      getServerConfig: () => ({
        NODE_ENV: "production",
        JWT_SECRET: "unit-test-secret-32-chars-minimum!",
        PAYSTACK_SECRET_KEY: "",
        PAYSTACK_CALLBACK_URL: "https://www.mqulima.com/payments/paystack/callback",
      }),
    }));

    const { verifyPaystackTransactionApi } = await import(
      "../src/lib/payments/providers/paystack/paystack.api"
    );
    const { PaystackService } = await import("../src/lib/payments/providers/paystack/paystack.service");

    await expect(verifyPaystackTransactionApi("MQ_TEST_REF")).rejects.toThrow(
      /PAYSTACK_SECRET_KEY/
    );

    const payload = JSON.stringify({ event: "charge.success", data: { reference: "MQ_TEST_REF" } });
    const forgedSig = crypto.createHmac("sha512", "any-secret").update(payload).digest("hex");
    expect(PaystackService.verifyWebhookSignature(payload, forgedSig)).toBe(false);
  });

  it("fails closed in production when SMTP credentials are missing", async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    delete process.env.SMTP_MOCK;
    vi.resetModules();
    vi.doMock("../src/lib/config.server", () => ({
      getServerConfig: () => ({
        NODE_ENV: "production",
        JWT_SECRET: "unit-test-secret-32-chars-minimum!",
        SMTP_MOCK: false,
      }),
    }));

    const { getMailTransporter, sendVerificationOtpEmail, sendPasswordRecoveryEmail } = await import(
      "../src/lib/email-service.server"
    );

    expect(getMailTransporter()).toBeNull();
    const otpRes = await sendVerificationOtpEmail({ toEmail: "farmer@mqulima.com", otpCode: "123456" });
    expect(otpRes.success).toBe(false);
    expect(otpRes.error).toContain("SMTP credentials");

    const recRes = await sendPasswordRecoveryEmail({
      toEmail: "farmer@mqulima.com",
      otpCode: "123456",
      magicLinkUrl: "https://www.mqulima.com/reset",
    });
    expect(recRes.success).toBe(false);
    expect(recRes.error).toContain("SMTP credentials");
  });

  it("fails closed when TEXTSMS credentials are missing in non-mock mode", async () => {
    delete process.env.TEXTSMS_API_KEY;
    delete process.env.TEXTSMS_PARTNER_ID;
    delete process.env.TEXTSMS_SENDER_ID;
    delete process.env.TEXTSMS_MOCK_MODE;
    process.env.NODE_ENV = "production";
    vi.resetModules();
    vi.doMock("../src/lib/db.server", () => ({
      getDb: () => async () => [],
    }));

    const { sendSms } = await import("../src/lib/sms-service.server");
    const smsRes = await sendSms({
      phoneNumber: "0712345678",
      message: "Test message",
      triggerType: "manual_test",
    });
    expect(smsRes.success).toBe(false);
    expect(smsRes.error).toContain("TEXTSMS_API_KEY");
  });

  it("fails closed for JWT verification and OTP hashing without secrets", async () => {
    delete process.env.JWT_SECRET;
    vi.resetModules();
    vi.doMock("../src/lib/config.server", () => ({
      getServerConfig: () => ({
        NODE_ENV: "production",
        JWT_SECRET: "",
      }),
    }));

    const { hashOtp } = await import("../src/lib/otp.server");
    const { getAuthUserFromRequest } = await import("../src/lib/api/ai-helpers.server");
    const jose = await import("jose");
    const legacyForgedJwt = await new jose.SignJWT({ sub: "11111111-1111-4111-8111-111111111111" })
      .setProtectedHeader({ alg: "HS256" })
      .sign(new TextEncoder().encode("mqulima_jwt_production_secret_key_2026_secure_auth_99"));

    expect(() => hashOtp("123456")).toThrow(/JWT_SECRET/);
    await expect(
      getAuthUserFromRequest(
        new Request("https://www.mqulima.com/api/ai/chat", {
          headers: { Authorization: `Bearer ${legacyForgedJwt}` },
        })
      )
    ).resolves.toBeNull();
  });
});
