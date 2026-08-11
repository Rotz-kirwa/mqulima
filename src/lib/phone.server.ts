import { z } from "zod";

/**
 * Normalizes a Kenyan phone number into canonical E.164 format without leading plus (e.g. 254712345678).
 * Accepts:
 *  - 07XXXXXXXX -> 2547XXXXXXXX
 *  - 01XXXXXXXX -> 2541XXXXXXXX
 *  - 2547XXXXXXXX / 2541XXXXXXXX -> 2547XXXXXXXX / 2541XXXXXXXX
 *  - +2547XXXXXXXX / +2541XXXXXXXX -> 2547XXXXXXXX / 2541XXXXXXXX
 * Throws an error if the phone number is invalid.
 */
export function normalizeKenyanPhone(input: string): string {
  if (!input || typeof input !== "string") {
    throw new Error("Phone number is required");
  }

  // Remove spaces, hyphens, and leading plus sign
  const cleaned = input.replace(/[\s\-\(\)\+]/g, "").trim();

  // Pattern 1: 07XXXXXXXX or 01XXXXXXXX (10 digits starting with 07 or 01)
  if (/^0[71]\d{8}$/.test(cleaned)) {
    return `254${cleaned.slice(1)}`;
  }

  // Pattern 2: 2547XXXXXXXX or 2541XXXXXXXX (12 digits starting with 2547 or 2541)
  if (/^254[71]\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  throw new Error("Invalid Kenyan phone number. Must be a valid 10-digit local (e.g. 0712345678) or 12-digit format (e.g. 254712345678).");
}

export function validateKenyanPhone(input: string): boolean {
  try {
    normalizeKenyanPhone(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * Zod schema transformer that validates and normalizes Kenyan phone numbers.
 */
export const KenyanPhoneSchema = z.string().transform((val, ctx) => {
  try {
    return normalizeKenyanPhone(val);
  } catch (err: any) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: err.message || "Invalid Kenyan phone number format",
    });
    return z.NEVER;
  }
});
