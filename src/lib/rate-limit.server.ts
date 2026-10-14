import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { getRequestHeaders } from "@tanstack/react-start/server";

/**
 * Validate that an IP string is a valid IPv4 or IPv6 address to prevent header injection.
 */
function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== "string") return false;
  const clean = ip.trim();
  // IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(clean)) {
    return clean.split(".").every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255 && String(num) === octet;
    });
  }
  // IPv6 validation
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{1,4}$|^::$|^::1$/;
  return ipv6Regex.test(clean);
}

/**
 * Resolves the client IP address using trusted proxy infrastructure rules.
 */
export function getClientIp(customRequest?: Request): string {
  try {
    const headers = customRequest ? customRequest.headers : getRequestHeaders();
    const trustProxy = process.env.TRUST_PROXY !== "false";

    if (trustProxy && headers) {
      // 1. Cloudflare edge header (cryptographically asserted by Cloudflare infrastructure)
      const cfConnectingIp = headers.get("cf-connecting-ip");
      if (cfConnectingIp && isValidIp(cfConnectingIp)) {
        return cfConnectingIp.trim();
      }

      // 2. Direct reverse proxy header set by Nginx / Caddy / Render
      const realIp = headers.get("x-real-ip");
      if (realIp && isValidIp(realIp)) {
        return realIp.trim();
      }

      // 3. X-Forwarded-For header: parse and validate entries
      const forwardedFor = headers.get("x-forwarded-for");
      if (forwardedFor) {
        const ips = forwardedFor
          .split(",")
          .map((ip: string) => ip.trim())
          .filter(isValidIp);

        if (ips.length > 0) {
          return ips[0];
        }
      }
    }
  } catch {
    // getRequestHeaders may throw if called outside server request context
  }
  return "127.0.0.1";
}

/**
 * Thread-safe In-Memory Sliding Window Rate Limiter.
 * Provides resilient, automatic local fallback when Upstash Redis is offline or unconfigured.
 */
export class InMemorySlidingWindowLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Periodic cleanup of stale IP records every 5 minutes (unref'd to prevent hanging serverless runtimes)
    if (typeof setInterval !== "undefined") {
      this.cleanupTimer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      this.cleanupTimer?.unref?.();
    }
  }

  public limit(key: string): { success: boolean; reset: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = this.requests.get(key) || [];

    // Filter out timestamps outside the current window
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= this.maxRequests) {
      const oldestInWindow = validTimestamps[0];
      const resetTime = oldestInWindow + this.windowMs;
      return { success: false, reset: resetTime };
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return { success: true, reset: now + this.windowMs };
  }

  public reset(): void {
    this.requests.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter((t) => t > windowStart);
      if (valid.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, valid);
      }
    }
  }
}

// In-Memory Fallback Limiters
const fallbackLoginLimiter = new InMemorySlidingWindowLimiter(10, 15 * 60 * 1000);
const fallbackSignupLimiter = new InMemorySlidingWindowLimiter(20, 15 * 60 * 1000);
const fallbackAccountLimiter = new InMemorySlidingWindowLimiter(10, 15 * 60 * 1000);
const fallbackApiLimiter = new InMemorySlidingWindowLimiter(100, 60 * 1000);
const fallbackRecoveryIpLimiter = new InMemorySlidingWindowLimiter(10, 60 * 60 * 1000);
const fallbackRecoveryAccountLimiter = new InMemorySlidingWindowLimiter(3, 60 * 60 * 1000);
const fallbackRecoveryVerifyLimiter = new InMemorySlidingWindowLimiter(5, 10 * 60 * 1000);

let redis: Redis | null = null;
let loginLimiter: Ratelimit | null = null;
let signupLimiter: Ratelimit | null = null;
let accountLockoutLimiter: Ratelimit | null = null;
let apiLimiter: Ratelimit | null = null;
let recoveryIpLimiter: Ratelimit | null = null;
let recoveryAccountLimiter: Ratelimit | null = null;
let recoveryVerifyLimiter: Ratelimit | null = null;

// Support both Upstash standard variables and Vercel KV aliases
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

if (redisUrl && redisToken) {
  try {
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    loginLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "15 m"),
      analytics: true,
      prefix: "mq_limit_login",
    });

    signupLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "15 m"),
      analytics: true,
      prefix: "mq_limit_signup",
    });

    accountLockoutLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "15 m"),
      analytics: true,
      prefix: "mq_limit_lockout",
    });

    apiLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "mq_limit_api",
    });

    recoveryIpLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      analytics: true,
      prefix: "mq_limit_rec_ip",
    });

    recoveryAccountLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 h"),
      analytics: true,
      prefix: "mq_limit_rec_acc",
    });

    recoveryVerifyLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      analytics: true,
      prefix: "mq_limit_rec_ver",
    });
  } catch (err) {
    console.warn("[RATE LIMIT] Upstash Redis initialization error; falling back to in-memory limiter:", err);
  }
}

// Single idempotent advisory logger to eliminate log noise on every SSR import
let hasLoggedAdvisory = false;
function logSecurityAdvisoryOnce(): void {
  if (hasLoggedAdvisory) return;
  hasLoggedAdvisory = true;

  if (redis) {
    console.info("[RATE LIMIT] Distributed Upstash Redis rate limiter active.");
  } else if (process.env.NODE_ENV === "production") {
    // Only emit security advisory once in production environments
    console.warn(
      "[SECURITY ADVISORY] Upstash Redis credentials (UPSTASH_REDIS_REST_URL / KV_REST_API_URL) not detected. Active in-memory sliding window rate limiter engaged. Multi-instance serverless deployments should configure Upstash Redis for distributed protection."
    );
  }
}

/**
 * Diagnostics helper that returns rate limiting status without exposing sensitive tokens.
 */
export function getRateLimitStatus(): {
  backend: "redis" | "memory";
  configured: boolean;
  provider: "upstash" | "vercel_kv" | "none";
  host: string | null;
  isServerless: boolean;
} {
  const isServerless = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
  const isUpstash = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  const isVercelKv = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  let host: string | null = null;
  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      host = parsed.hostname;
    } catch {
      host = "configured (unparseable host)";
    }
  }

  return {
    backend: redis ? "redis" : "memory",
    configured: Boolean(redis),
    provider: isUpstash ? "upstash" : isVercelKv ? "vercel_kv" : "none",
    host,
    isServerless,
  };
}

/**
 * Health check helper to verify Redis connectivity.
 */
export async function testRedisConnection(): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
  if (!redis) {
    return { success: false, error: "Redis is not configured in this environment." };
  }
  const start = performance.now();
  try {
    const pingPromise = redis.ping();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Redis ping timed out after 3000ms")), 3000)
    );
    const pong = await Promise.race([pingPromise, timeoutPromise]);
    const latencyMs = Math.round(performance.now() - start);
    return { success: pong === "PONG" || Boolean(pong), latencyMs };
  } catch (err: any) {
    return { success: false, error: err?.message || "Unknown Redis connection error" };
  }
}

/**
 * Wraps a promise in a timeout to guarantee rate limit checks never hang user requests.
 */
async function withLimitTimeout<T>(promise: Promise<T>, timeoutMs = 2000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Rate limit check timed out after ${timeoutMs}ms`)), timeoutMs);
    timer?.unref?.();
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

function isLocalhostIp(ip: string): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    !process.env.NODE_ENV ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip === "::ffff:127.0.0.1"
  );
}

export async function checkLoginRateLimit(ip: string): Promise<void> {
  logSecurityAdvisoryOnce();
  if (isLocalhostIp(ip)) {
    return;
  }

  if (loginLimiter) {
    try {
      const { success } = await withLimitTimeout(loginLimiter.limit(ip));
      if (!success) {
        throw new Error("Too many login attempts from this network. Please try again in 15 minutes.");
      }
      return;
    } catch (err) {
      if (err instanceof Error && err.message.includes("Too many")) {
        throw err;
      }
      console.warn("[RATE LIMIT FAIL-SAFE] Upstash login check failed, falling back safely to in-memory limiter:", (err as any)?.message || err);
    }
  }

  // Fallback to In-Memory Limiter
  const { success } = fallbackLoginLimiter.limit(ip);
  if (!success) {
    throw new Error("Too many login attempts from this network. Please try again in 15 minutes.");
  }
}

export async function checkSignupRateLimit(ip: string): Promise<void> {
  logSecurityAdvisoryOnce();
  if (isLocalhostIp(ip)) {
    return;
  }

  if (signupLimiter) {
    try {
      const { success } = await withLimitTimeout(signupLimiter.limit(ip));
      if (!success) {
        throw new Error("Too many registration attempts from this network. Please try again in 15 minutes.");
      }
      return;
    } catch (err) {
      if (err instanceof Error && err.message.includes("Too many")) {
        throw err;
      }
      console.warn("[RATE LIMIT FAIL-SAFE] Upstash signup check failed, falling back safely to in-memory limiter:", (err as any)?.message || err);
    }
  }

  const { success } = fallbackSignupLimiter.limit(ip);
  if (!success) {
    throw new Error("Too many registration attempts from this network. Please try again in 15 minutes.");
  }
}

export async function checkBruteForceAccountLockout(identifier: string): Promise<void> {
  logSecurityAdvisoryOnce();
  const cleanId = identifier.trim().toLowerCase();
  const accountKey = `acc:${cleanId}`;

  if (accountLockoutLimiter) {
    try {
      const { success } = await withLimitTimeout(accountLockoutLimiter.limit(accountKey));
      if (!success) {
        throw new Error("Account temporarily locked due to multiple failed login attempts. Please wait 15 minutes.");
      }
      return;
    } catch (err) {
      if (err instanceof Error && err.message.includes("Account temporarily locked")) {
        throw err;
      }
      console.warn("[RATE LIMIT FAIL-SAFE] Upstash lockout check failed, falling back safely to in-memory limiter:", (err as any)?.message || err);
    }
  }

  const { success } = fallbackAccountLimiter.limit(accountKey);
  if (!success) {
    throw new Error("Account temporarily locked due to multiple failed login attempts. Please wait 15 minutes.");
  }
}

export async function checkApiRateLimit(ip: string): Promise<void> {
  logSecurityAdvisoryOnce();
  if (apiLimiter) {
    try {
      const { success } = await withLimitTimeout(apiLimiter.limit(ip));
      if (!success) {
        throw new Error("Too many requests. Please try again later.");
      }
      return;
    } catch (err) {
      if (err instanceof Error && err.message.includes("Too many requests")) {
        throw err;
      }
      console.warn("[RATE LIMIT FAIL-SAFE] Upstash API check failed, falling back safely to in-memory limiter:", (err as any)?.message || err);
    }
  }

  // Fallback to In-Memory Limiter
  const { success } = fallbackApiLimiter.limit(ip);
  if (!success) {
    throw new Error("Too many requests. Please try again later.");
  }
}

/**
 * Rate limit check for password recovery request:
 * - Max 10 requests per hour per IP
 * - Max 3 requests per hour per account
 */
export async function checkRecoveryRequestRateLimit(
  ip: string,
  identifier?: string
): Promise<{ success: boolean; error?: string }> {
  logSecurityAdvisoryOnce();

  // 1. IP rate limiting (10 per hour)
  if (!isLocalhostIp(ip)) {
    if (recoveryIpLimiter) {
      try {
        const { success } = await withLimitTimeout(recoveryIpLimiter.limit(ip));
        if (!success) {
          return {
            success: false,
            error: "Too many recovery attempts from this network. Please wait an hour before trying again.",
          };
        }
      } catch (err) {
        console.warn("[RATE LIMIT FAIL-SAFE] Upstash recovery IP check error:", (err as any)?.message || err);
      }
    }
    const ipRes = fallbackRecoveryIpLimiter.limit(ip);
    if (!ipRes.success) {
      return {
        success: false,
        error: "Too many recovery attempts from this network. Please wait an hour before trying again.",
      };
    }
  }

  // 2. Account rate limiting (3 per hour)
  if (identifier) {
    const cleanId = identifier.trim().toLowerCase();
    const accountKey = `acc:${cleanId}`;
    if (recoveryAccountLimiter) {
      try {
        const { success } = await withLimitTimeout(recoveryAccountLimiter.limit(accountKey));
        if (!success) {
          return {
            success: false,
            error: "Too many password recovery requests for this account. Maximum 3 requests per hour allowed.",
          };
        }
      } catch (err) {
        console.warn("[RATE LIMIT FAIL-SAFE] Upstash recovery account check error:", (err as any)?.message || err);
      }
    }
    const accRes = fallbackRecoveryAccountLimiter.limit(accountKey);
    if (!accRes.success) {
      return {
        success: false,
        error: "Too many password recovery requests for this account. Maximum 3 requests per hour allowed.",
      };
    }
  }

  return { success: true };
}

/**
 * Rate limit check for wrong code attempts (Max 5 attempts)
 */
export async function checkRecoveryAttemptRateLimit(codeKey: string): Promise<{ success: boolean; error?: string }> {
  logSecurityAdvisoryOnce();

  if (recoveryVerifyLimiter) {
    try {
      const { success } = await withLimitTimeout(recoveryVerifyLimiter.limit(codeKey));
      if (!success) {
        return {
          success: false,
          error: "Maximum verification attempts exceeded. This recovery code has been locked.",
        };
      }
    } catch (err) {
      console.warn("[RATE LIMIT FAIL-SAFE] Upstash recovery verify check error:", (err as any)?.message || err);
    }
  }

  const verRes = fallbackRecoveryVerifyLimiter.limit(codeKey);
  if (!verRes.success) {
    return {
      success: false,
      error: "Maximum verification attempts exceeded. This recovery code has been locked.",
    };
  }

  return { success: true };
}

/**
 * Reset in-memory limiters for testing purposes.
 */
export function resetInMemoryRateLimiters(): void {
  fallbackLoginLimiter.reset();
  fallbackSignupLimiter.reset();
  fallbackAccountLimiter.reset();
  fallbackApiLimiter.reset();
  fallbackRecoveryIpLimiter.reset();
  fallbackRecoveryAccountLimiter.reset();
  fallbackRecoveryVerifyLimiter.reset();
}
