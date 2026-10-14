import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getClientIp,
  InMemorySlidingWindowLimiter,
  getRateLimitStatus,
  checkLoginRateLimit,
  checkSignupRateLimit,
  checkBruteForceAccountLockout,
  checkApiRateLimit,
  checkRecoveryRequestRateLimit,
  checkRecoveryAttemptRateLimit,
  resetInMemoryRateLimiters,
} from "../src/lib/rate-limit.server";

describe("Production Rate Limiting Suite", () => {
  beforeEach(() => {
    resetInMemoryRateLimiters();
    vi.restoreAllMocks();
  });

  describe("1. Client IP Resolution & Header Sanitization", () => {
    it("should extract client IP from cf-connecting-ip header when valid", () => {
      const req = new Request("https://mqulima.com/api/test", {
        headers: { "cf-connecting-ip": "197.237.100.5" },
      });
      expect(getClientIp(req)).toBe("197.237.100.5");
    });

    it("should extract client IP from x-real-ip header", () => {
      const req = new Request("https://mqulima.com/api/test", {
        headers: { "x-real-ip": "41.89.22.15" },
      });
      expect(getClientIp(req)).toBe("41.89.22.15");
    });

    it("should extract client IP from the first valid hop in x-forwarded-for", () => {
      const req = new Request("https://mqulima.com/api/test", {
        headers: { "x-forwarded-for": "102.135.168.1, 10.0.0.1, 172.16.0.1" },
      });
      expect(getClientIp(req)).toBe("102.135.168.1");
    });

    it("should reject invalid/malformed IP strings and fallback to 127.0.0.1", () => {
      const req = new Request("https://mqulima.com/api/test", {
        headers: {
          "cf-connecting-ip": "999.999.999.999",
          "x-real-ip": "not-a-valid-ip",
          "x-forwarded-for": "malicious-payload, 300.1.1.1",
        },
      });
      expect(getClientIp(req)).toBe("127.0.0.1");
    });
  });

  describe("2. Rate Limit Status & Secret Leak Prevention", () => {
    it("should report rate limit status without exposing secrets or tokens", () => {
      const status = getRateLimitStatus();
      expect(status).toHaveProperty("backend");
      expect(status).toHaveProperty("configured");
      expect(status).toHaveProperty("provider");
      expect(status).toHaveProperty("host");
      expect(status).toHaveProperty("isServerless");

      // Verify no sensitive tokens are exposed in JSON serialization
      const json = JSON.stringify(status);
      expect(json).not.toContain("token");
      expect(json).not.toContain("secret");
      expect(json).not.toContain("password");
    });
  });

  describe("3. In-Memory Sliding Window Limiter Mechanics", () => {
    it("should allow requests up to the max threshold within window", () => {
      const limiter = new InMemorySlidingWindowLimiter(3, 1000);
      const res1 = limiter.limit("test-key-1");
      const res2 = limiter.limit("test-key-1");
      const res3 = limiter.limit("test-key-1");

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      expect(res3.success).toBe(true);
    });

    it("should reject requests exceeding max threshold within window", () => {
      const limiter = new InMemorySlidingWindowLimiter(2, 60000);
      limiter.limit("test-key-2");
      limiter.limit("test-key-2");
      const res3 = limiter.limit("test-key-2");

      expect(res3.success).toBe(false);
      expect(res3.reset).toBeGreaterThan(Date.now());
    });

    it("should isolate limits across different keys", () => {
      const limiter = new InMemorySlidingWindowLimiter(2, 60000);
      limiter.limit("user-A");
      limiter.limit("user-A");
      expect(limiter.limit("user-A").success).toBe(false);

      // user-B should still be permitted
      expect(limiter.limit("user-B").success).toBe(true);
    });
  });

  describe("4. Sensitive Endpoints Protection & Fail-Safe", () => {
    it("should enforce login rate limit (10 per 15m) for non-localhost IPs", async () => {
      const testIp = "41.90.1.200";

      // 10 allowed attempts
      for (let i = 0; i < 10; i++) {
        await expect(checkLoginRateLimit(testIp)).resolves.not.toThrow();
      }

      // 11th attempt must be rejected
      await expect(checkLoginRateLimit(testIp)).rejects.toThrow(
        "Too many login attempts from this network. Please try again in 15 minutes."
      );
    });

    it("should bypass rate limits for localhost in development/test", async () => {
      for (let i = 0; i < 25; i++) {
        await expect(checkLoginRateLimit("127.0.0.1")).resolves.not.toThrow();
      }
    });

    it("should enforce account lockout protection across brute-force login attempts", async () => {
      const email = "target.farmer@example.com";

      for (let i = 0; i < 10; i++) {
        await expect(checkBruteForceAccountLockout(email)).resolves.not.toThrow();
      }

      await expect(checkBruteForceAccountLockout(email)).rejects.toThrow(
        "Account temporarily locked due to multiple failed login attempts. Please wait 15 minutes."
      );
    });

    it("should enforce API rate limits (100 req/min)", async () => {
      const apiIp = "196.201.214.33";

      for (let i = 0; i < 100; i++) {
        await expect(checkApiRateLimit(apiIp)).resolves.not.toThrow();
      }

      await expect(checkApiRateLimit(apiIp)).rejects.toThrow("Too many requests. Please try again later.");
    });

    it("should enforce recovery request rate limits per IP and per account", async () => {
      const recIp = "196.201.214.50";
      const account = "recovery.user@example.com";

      // 3 attempts allowed per account
      const res1 = await checkRecoveryRequestRateLimit(recIp, account);
      const res2 = await checkRecoveryRequestRateLimit(recIp, account);
      const res3 = await checkRecoveryRequestRateLimit(recIp, account);

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      expect(res3.success).toBe(true);

      const res4 = await checkRecoveryRequestRateLimit(recIp, account);
      expect(res4.success).toBe(false);
      expect(res4.error).toContain("Maximum 3 requests per hour allowed");
    });

    it("should lock verification attempts after 5 invalid codes", async () => {
      const codeKey = "code:xyz-test-key";

      for (let i = 0; i < 5; i++) {
        const res = await checkRecoveryAttemptRateLimit(codeKey);
        expect(res.success).toBe(true);
      }

      const res6 = await checkRecoveryAttemptRateLimit(codeKey);
      expect(res6.success).toBe(false);
      expect(res6.error).toContain("Maximum verification attempts exceeded");
    });
  });
});
