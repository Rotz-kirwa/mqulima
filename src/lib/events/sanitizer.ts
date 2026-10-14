/**
 * Privacy and PII Guardrail Sanitizer for Mqulima Telemetry & Events
 * Strips personally identifiable data, credentials, and sensitive parameters.
 */

const EMAIL_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/gi;
const KENYA_PHONE_REGEX = /(?:\+?254|0)[17]\d{8}/g;
const JWT_OR_BEARER_REGEX = /Bearer\s+[A-Za-z0-9\-_\.]+|eyJ[A-Za-z0-9\-_]{10,}\.[A-Za-z0-9\-_]{10,}/gi;
const NATIONAL_ID_SUSPECT = /\b\d{7,9}\b/g;

/**
 * Sanitizes an individual string value, replacing sensitive patterns with placeholders.
 */
export function sanitizeString(val: string): string {
  if (!val) return val;
  return val
    .replace(EMAIL_REGEX, "[REDACTED_EMAIL]")
    .replace(JWT_OR_BEARER_REGEX, "[REDACTED_TOKEN]")
    .replace(KENYA_PHONE_REGEX, "[REDACTED_PHONE]")
    .substring(0, 120); // Prevent overflow
}

/**
 * Sanitizes a URL by stripping sensitive query parameters (tokens, passwords, emails, phones)
 * while preserving campaign attribution parameters (utm_source, utm_medium, utm_campaign, ref).
 */
export function sanitizeUrl(urlStr: string): string {
  if (!urlStr) return urlStr;
  try {
    const url = new URL(urlStr);
    const params = new URLSearchParams(url.search);
    const sensitiveKeys = [
      "token", "access_token", "auth", "otp", "code", "password", "pwd",
      "email", "phone", "id_number", "national_id", "secret", "session", "key"
    ];

    for (const key of Array.from(params.keys())) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        params.delete(key);
      }
    }

    url.search = params.toString();
    return sanitizeString(url.toString());
  } catch {
    return sanitizeString(urlStr);
  }
}

/**
 * Strips sensitive keys or values from an event payload object.
 */
export function sanitizeEventPayload<T extends Record<string, any>>(payload: T): Record<string, any> {
  if (!payload || typeof payload !== "object") return {};

  const sensitiveKeyPatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /otp/i,
    /auth/i,
    /bearer/i,
    /national_?id/i,
    /id_?number/i,
    /email/i,
    /phone/i,
    /first_?name/i,
    /last_?name/i,
    /credit_?card/i,
    /api_?key/i,
    /pin\b/i,
  ];

  const clean: Record<string, any> = {};

  for (const [k, v] of Object.entries(payload)) {
    // Drop sensitive keys completely
    if (sensitiveKeyPatterns.some((pattern) => pattern.test(k))) {
      continue;
    }

    if (v === null || v === undefined) {
      continue;
    }

    if (typeof v === "string") {
      clean[k] = sanitizeString(v);
    } else if (typeof v === "number" || typeof v === "boolean") {
      clean[k] = v;
    } else if (Array.isArray(v)) {
      clean[k] = v
        .slice(0, 10)
        .map((item) => (typeof item === "string" ? sanitizeString(item) : item));
    } else if (typeof v === "object") {
      clean[k] = sanitizeEventPayload(v);
    }
  }

  return clean;
}
