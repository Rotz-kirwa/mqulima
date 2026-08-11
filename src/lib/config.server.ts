import process from "node:process";
import { z } from "zod";

/**
 * Server Configuration & Environment Variable Validation Module
 * 
 * Validates all required environment variables at runtime.
 * Throws a clear, descriptive startup error if mandatory secrets or settings are invalid.
 */

const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL environment variable is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  UPSTASH_REDIS_REST_URL: z.string().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal("")),
  GEMINI_API_KEY: z.string().optional().or(z.literal("")),
  MPESA_CONSUMER_KEY: z.string().optional().or(z.literal("")),
  MPESA_CONSUMER_SECRET: z.string().optional().or(z.literal("")),
  MPESA_PASSKEY: z.string().optional().or(z.literal("")),
  MPESA_SHORTCODE: z.string().optional().or(z.literal("")),
  MPESA_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  MPESA_WEBHOOK_SECRET: z.string().optional().or(z.literal("")),
  ALLOW_DEV_CSRF_BYPASS: z.string().optional().or(z.literal("")),
  S3_BUCKET: z.string().default("mqulima-media"),
  S3_REGION: z.string().default("auto"),
  S3_ENDPOINT: z.string().optional().or(z.literal("")),
  S3_ACCESS_KEY_ID: z.string().optional().or(z.literal("")),
  S3_SECRET_ACCESS_KEY: z.string().optional().or(z.literal("")),
  CDN_PUBLIC_URL: z.string().default("https://cdn.mqulima.com"),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

let validatedEnv: ServerEnv | null = null;

export function getServerConfig(): ServerEnv {
  if (validatedEnv) {
    return validatedEnv;
  }

  const isProd = process.env.NODE_ENV === "production";

  const rawEnv = {
    NODE_ENV: process.env.NODE_ENV || "development",
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://mqulima:password@localhost:5432/mqulima_dev",
    JWT_SECRET: process.env.JWT_SECRET || (isProd ? "" : "mqulima-jwt-secret-key-production-2026-secure"),
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || "",
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
    MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY || "",
    MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET || "",
    MPESA_PASSKEY: process.env.MPESA_PASSKEY || "",
    MPESA_SHORTCODE: process.env.MPESA_SHORTCODE || "",
    MPESA_ENVIRONMENT: (process.env.MPESA_ENVIRONMENT as "sandbox" | "production") || "sandbox",
    MPESA_WEBHOOK_SECRET: process.env.MPESA_WEBHOOK_SECRET || "",
    ALLOW_DEV_CSRF_BYPASS: process.env.ALLOW_DEV_CSRF_BYPASS || "",
    S3_BUCKET: process.env.S3_BUCKET || "mqulima-media",
    S3_REGION: process.env.S3_REGION || "auto",
    S3_ENDPOINT: process.env.S3_ENDPOINT || "",
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || "",
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || "",
    CDN_PUBLIC_URL: process.env.CDN_PUBLIC_URL || "https://cdn.mqulima.com",
  };

  const result = ServerEnvSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorFormatted = result.error.issues
      .map((issue) => ` - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    
    if (isProd) {
      throw new Error(`[FATAL SECURITY ERROR] Invalid production environment configuration:\n${errorFormatted}`);
    } else {
      console.warn("[WARN] Environment Configuration Warning:\n" + errorFormatted);
      validatedEnv = rawEnv as ServerEnv;
    }
  } else {
    validatedEnv = result.data;
  }

  return validatedEnv;
}
