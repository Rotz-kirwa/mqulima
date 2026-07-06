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

let redis: Redis | null = null;
let loginLimiter: Ratelimit | null = null;
let apiLimiter: Ratelimit | null = null;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (redisUrl && redisToken) {
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
} else {
  console.warn("Upstash Redis credentials missing. Rate limiting is disabled.");
}

export async function checkLoginRateLimit(ip: string): Promise<void> {
  if (!loginLimiter) return;
  const { success } = await loginLimiter.limit(ip);
  if (!success) {
    throw new Error("Too many attempts. Try again in 15 minutes.");
  }
}

export async function checkApiRateLimit(ip: string): Promise<void> {
  if (!apiLimiter) return;
  const { success } = await apiLimiter.limit(ip);
  if (!success) {
    throw new Error("Too many requests. Please try again later.");
  }
}
