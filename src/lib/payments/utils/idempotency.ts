/**
 * Mqulima Payment Engine — Idempotency & Reference Generator
 */

/**
 * Generates a unique, traceable merchant reference for NCBA payment transactions.
 * Format: MQ-NCBA-<ShortOrderId>-<TimestampSuffix>
 */
export function generateMerchantReference(orderId: string): string {
  const cleanId = orderId.replace(/-/g, "").toUpperCase();
  const shortId = cleanId.slice(0, 8);
  const timestamp = Date.now().toString(36).toUpperCase();
  return `MQ-NCBA-${shortId}-${timestamp}`;
}

/**
 * Normalizes merchant reference for account matching.
 */
export function sanitizeReference(ref: string): string {
  return ref.trim().toUpperCase();
}
