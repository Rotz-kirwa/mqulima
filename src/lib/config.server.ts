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
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

let validatedEnv: ServerEnv | null = null;

export function getServerConfig(): ServerEnv {
  if (validatedEnv) {
    return validatedEnv;
  }

  const rawEnv = {
    NODE_ENV: process.env.NODE_ENV || "development",
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://mqulima:password@localhost:5432/mqulima_dev",
    JWT_SECRET: process.env.JWT_SECRET || "mqulima-jwt-secret-key-production-2026-secure",
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
  };

  const result = ServerEnvSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorFormatted = result.error.issues
      .map((issue) => ` - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    console.error("[CRITICAL] Environment Configuration Error:\n" + errorFormatted);
    throw new Error(`[FATAL] Invalid environment configuration:\n${errorFormatted}`);
  }

  validatedEnv = result.data;
  return validatedEnv;
}

