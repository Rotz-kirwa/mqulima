/**
 * Mqulima Payment Engine — Phone Number Normalization & Validation Utility
 * Supports standard Kenyan phone formats:
 * - 07XXXXXXXX
 * - 01XXXXXXXX
 * - 2547XXXXXXXX
 * - 2541XXXXXXXX
 * - +2547XXXXXXXX
 * - +2541XXXXXXXX
 */

export interface PhoneNormalizationResult {
  isValid: boolean;
  normalized?: string;
  error?: string;
}

/**
 * Normalizes any valid Kenyan phone number string to international standard format: 254XXXXXXXXX
 */
export function normalizeKenyanPhone(phoneInput: string): PhoneNormalizationResult {
  if (!phoneInput || typeof phoneInput !== "string") {
    return { isValid: false, error: "Phone number string is required." };
  }

  // Strip spaces, dashes, parentheses, and leading plus sign
  let cleaned = phoneInput.replace(/[\s\-\(\)]/g, "").replace(/^\+/, "").trim();

  // If local 07... or 01... format (10 digits)
  if (/^0[71]\d{8}$/.test(cleaned)) {
    cleaned = "254" + cleaned.slice(1);
  }

  // Check 12-digit format starting with 2547 or 2541
  if (/^254[71]\d{8}$/.test(cleaned)) {
    return {
      isValid: true,
      normalized: cleaned,
    };
  }

  return {
    isValid: false,
    error: "Invalid Kenyan phone number format. Expected format: 07XXXXXXXX, 01XXXXXXXX, or 2547XXXXXXXX.",
  };
}

/**
 * Validates whether a phone number matches valid Kenyan mobile number patterns.
 */
export function isValidKenyanPhone(phoneInput: string): boolean {
  const result = normalizeKenyanPhone(phoneInput);
  return result.isValid;
}

/**
 * Masks a phone number for sensitive audit logs (e.g., 2547****1234).
 */
export function maskPhoneNumber(phoneInput: string): string {
  const result = normalizeKenyanPhone(phoneInput);
  const phone = result.normalized || phoneInput;

  if (phone.length < 10) return "****";
  const start = phone.slice(0, 4);
  const end = phone.slice(-4);
  return `${start}****${end}`;
}
