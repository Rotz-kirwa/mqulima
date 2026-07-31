import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { getRequestHeaders } from "@tanstack/react-start/server";

export function getClientIp(): string {
  try {
    const headers = getRequestHeaders();
    const forwardedFor = headers.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }
    const realIp = headers.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
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

// Instantiate Fallback Limiters (Login: 5 per 15 min; API: 100 per 1 min)
const fallbackLoginLimiter = new InMemorySlidingWindowLimiter(5, 15 * 60 * 1000);
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
      limiter: Ratelimit.slidingWindow(5, "15 m"),
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

export async function checkLoginRateLimit(ip: string): Promise<void> {
  if (loginLimiter) {
    try {
      const { success } = await loginLimiter.limit(ip);
      if (!success) {
        throw new Error("Too many login attempts. Please try again in 15 minutes.");
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
    throw new Error("Too many login attempts. Please try again in 15 minutes.");
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

