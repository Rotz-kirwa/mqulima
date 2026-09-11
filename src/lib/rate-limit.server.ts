import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { getRequestHeaders } from "@tanstack/react-start/server";

/**
 * Validate that an IP string is a valid IPv4 or IPv6 address to prevent header injection
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
 * Deployment assumption:
 * - When TRUST_PROXY is enabled (default in production environments like Render, Cloudflare, or AWS ALB),
 *   we prioritize CF-Connecting-IP, X-Real-IP, and validated X-Forwarded-For hops.
 * - When TRUST_PROXY=false, forwarded headers are ignored to prevent spoofing.
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
  } catch (err) {
    // getRequestHeaders may throw if called outside server request context
  }
  return "127.0.0.1";
}

/**
 * Thread-safe In-Memory Sliding Window Rate Limiter
 * Provides automatic local fallback when Upstash Redis is offline or unconfigured.
 */
class InMemorySlidingWindowLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Periodic cleanup of stale IP records every 5 minutes
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
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

// Separate Rate Limiters for Signup (20 per 15 min) and Login (10 per 15 min)
const fallbackLoginLimiter = new InMemorySlidingWindowLimiter(10, 15 * 60 * 1000);
const fallbackSignupLimiter = new InMemorySlidingWindowLimiter(20, 15 * 60 * 1000);
const fallbackAccountLimiter = new InMemorySlidingWindowLimiter(10, 15 * 60 * 1000);
const fallbackApiLimiter = new InMemorySlidingWindowLimiter(100, 60 * 1000);

let redis: Redis | null = null;
let loginLimiter: Ratelimit | null = null;
let apiLimiter: Ratelimit | null = null;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

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

    apiLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "mq_limit_api",
    });
  } catch (err) {
    console.warn("[RATE LIMIT] Upstash Redis initialization failed. Using in-memory rate limiting fallback.");
  }
} else {
  console.info("[RATE LIMIT] Upstash Redis credentials not detected. Active in-memory sliding window rate limiter engaged.");
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
  if (isLocalhostIp(ip)) {
    return;
  }

  if (loginLimiter) {
    try {
      const { success } = await loginLimiter.limit(ip);
      if (!success) {
        throw new Error("Too many login attempts from this network. Please try again in 15 minutes.");
      }
      return;
    } catch (err) {
      if (err instanceof Error && err.message.includes("Too many")) {
        throw err;
      }
      console.warn("[RATE LIMIT] Redis rate limit check failed, switching to in-memory fallback:", err);
    }
  }

  // Fallback to In-Memory Limiter
  const { success } = fallbackLoginLimiter.limit(ip);
  if (!success) {
    throw new Error("Too many login attempts from this network. Please try again in 15 minutes.");
  }
}

export async function checkSignupRateLimit(ip: string): Promise<void> {
  if (isLocalhostIp(ip)) {
    return;
  }

  const { success } = fallbackSignupLimiter.limit(ip);
  if (!success) {
    throw new Error("Too many registration attempts from this network. Please try again in 15 minutes.");
  }
}

export async function checkBruteForceAccountLockout(identifier: string): Promise<void> {
  const cleanId = identifier.trim().toLowerCase();
  const { success } = fallbackAccountLimiter.limit(`acc:${cleanId}`);
  if (!success) {
    throw new Error("Account temporarily locked due to multiple failed login attempts. Please wait 15 minutes.");
  }
}

export async function checkApiRateLimit(ip: string): Promise<void> {
  if (apiLimiter) {
    try {
      const { success } = await apiLimiter.limit(ip);
      if (!success) {
        throw new Error("Too many requests. Please try again later.");
      }
      return;
    } catch (err) {
      if (err instanceof Error && err.message.includes("Too many")) {
        throw err;
      }
      console.warn("[RATE LIMIT] Redis rate limit check failed, switching to in-memory fallback:", err);
    }
  }

  // Fallback to In-Memory Limiter
  const { success } = fallbackApiLimiter.limit(ip);
  if (!success) {
    throw new Error("Too many requests. Please try again later.");
  }
}
