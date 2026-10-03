import crypto from "node:crypto";
import { getDb } from "./db.server";
import { getServerConfig } from "./config.server";

export const OTP_LENGTH = 6;
export const OTP_EXPIRATION_MINUTES = 10;
export const MAX_VERIFICATION_ATTEMPTS = 5;
export const MAX_RESENDS_PER_WINDOW = 3;
export const RESEND_WINDOW_MINUTES = 15;

/**
 * Generates a cryptographically secure 6-digit numerical OTP code.
 * Guaranteed to be between '100000' and '999999'. Never uses Math.random().
 */
export function generateSecureOtp(): string {
  const codeInt = crypto.randomInt(100000, 1000000);
  return codeInt.toString();
}

/**
 * Derives a secure HMAC-SHA256 hash from a plaintext OTP using the application secret.
 * Plaintext OTP codes must NEVER be stored in the database.
 */
export function hashOtp(otp: string, secret?: string): string {
  const appSecret = secret || getServerConfig().JWT_SECRET || "mqulima-otp-default-secret";
  return crypto
    .createHmac("sha256", appSecret)
    .update(otp.trim())
    .digest("hex");
}

/**
 * Performs a timing-safe, constant-time comparison of a candidate OTP against a stored hash.
 * Prevents side-channel timing attacks.
 */
export function verifyOtpHash(candidateOtp: string, storedHash: string, secret?: string): boolean {
  if (!candidateOtp || !storedHash) return false;
  if (candidateOtp.trim().length !== OTP_LENGTH) return false;

  const candidateHash = hashOtp(candidateOtp, secret);
  const bufCandidate = Buffer.from(candidateHash, "hex");
  const bufStored = Buffer.from(storedHash, "hex");

  if (bufCandidate.length !== bufStored.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufCandidate, bufStored);
}

export interface CreateOtpParams {
  userId: string;
  email: string;
}

export interface CreateOtpResult {
  otpCode: string;
  expiresAt: Date;
  verificationId: string;
}

/**
 * Enforces rate limiting, invalidates old active OTPs, and creates a new hashed OTP record.
 */
export async function createAndStoreEmailOtp(params: CreateOtpParams): Promise<CreateOtpResult> {
  const sql = getDb();
  const cleanEmail = params.email.trim().toLowerCase();
  const secret = getServerConfig().JWT_SECRET;

  // 1. Rate Limit Check: Max 3 OTP requests per email in 15 minutes
  const windowStart = new Date(Date.now() - RESEND_WINDOW_MINUTES * 60 * 1000);
  const recentRequests = await sql`
    SELECT COUNT(*)::int as count
    FROM email_verifications
    WHERE LOWER(email) = ${cleanEmail}
      AND created_at >= ${windowStart.toISOString()}
  `;

  const count = recentRequests[0]?.count ?? 0;
  if (count >= MAX_RESENDS_PER_WINDOW) {
    throw new Error(
      `Too many verification code requests for this email. Please wait ${RESEND_WINDOW_MINUTES} minutes before requesting another code.`
    );
  }

  // 2. Invalidate any existing unused OTPs for this user / email
  await sql`
    UPDATE email_verifications
    SET used_at = NOW()
    WHERE (user_id = ${params.userId} OR LOWER(email) = ${cleanEmail})
      AND used_at IS NULL
  `;

  // 3. Generate cryptographically secure 6-digit OTP
  const otpCode = generateSecureOtp();
  const codeHash = hashOtp(otpCode, secret);
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  // 4. Store ONLY the code hash in the database
  const [record] = await sql`
    INSERT INTO email_verifications (
      user_id,
      email,
      code_hash,
      expires_at,
      attempts,
      created_at
    ) VALUES (
      ${params.userId},
      ${cleanEmail},
      ${codeHash},
      ${expiresAt.toISOString()},
      0,
      NOW()
    )
    RETURNING id
  `;

  return {
    otpCode,
    expiresAt,
    verificationId: record.id,
  };
}

export type VerifyOtpStatus =
  | { success: true; userId: string; email: string }
  | { success: false; error: string; code: "EXPIRED" | "INVALID" | "MAX_ATTEMPTS" | "NOT_FOUND" | "ALREADY_USED" };

/**
 * Validates a candidate OTP for a given email address.
 * Tracks verification attempts, handles expiration, single-use invalidation, and timing-safe equality.
 */
export async function verifyEmailOtp(email: string, candidateOtp: string): Promise<VerifyOtpStatus> {
  const sql = getDb();
  const cleanEmail = email.trim().toLowerCase();
  const secret = getServerConfig().JWT_SECRET;

  // Retrieve the latest verification record for this email
  const [record] = await sql`
    SELECT id, user_id, email, code_hash, expires_at, attempts, used_at, created_at
    FROM email_verifications
    WHERE LOWER(email) = ${cleanEmail}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (!record) {
    return {
      success: false,
      error: "No active verification code found for this email address.",
      code: "NOT_FOUND",
    };
  }

  // Check if code was already consumed
  if (record.used_at !== null) {
    return {
      success: false,
      error: "This verification code has already been used. Please request a new one.",
      code: "ALREADY_USED",
    };
  }

  // Check maximum failed attempts lockout (Max 5 attempts)
  if (record.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    // Invalidate the record to prevent further guessing
    await sql`
      UPDATE email_verifications
      SET used_at = NOW()
      WHERE id = ${record.id}
    `;
    return {
      success: false,
      error: "Maximum verification attempts exceeded. Please request a new verification code.",
      code: "MAX_ATTEMPTS",
    };
  }

  // Check expiration (10 minutes)
  const now = new Date();
  if (new Date(record.expires_at) < now) {
    await sql`
      UPDATE email_verifications
      SET used_at = NOW()
      WHERE id = ${record.id}
    `;
    return {
      success: false,
      error: "Verification code has expired. Please request a new one.",
      code: "EXPIRED",
    };
  }

  // Increment attempts counter
  const newAttempts = record.attempts + 1;
  await sql`
    UPDATE email_verifications
    SET attempts = ${newAttempts}
    WHERE id = ${record.id}
  `;

  // Verify OTP hash in constant time
  const isValid = verifyOtpHash(candidateOtp, record.code_hash, secret);
  if (!isValid) {
    const attemptsLeft = MAX_VERIFICATION_ATTEMPTS - newAttempts;
    const msg =
      attemptsLeft > 0
        ? `Invalid verification code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining.`
        : "Invalid verification code. Maximum attempts exceeded. Please request a new code.";

    if (attemptsLeft <= 0) {
      await sql`
        UPDATE email_verifications
        SET used_at = NOW()
        WHERE id = ${record.id}
      `;
    }

    return {
      success: false,
      error: msg,
      code: attemptsLeft > 0 ? "INVALID" : "MAX_ATTEMPTS",
    };
  }

  // Mark record as consumed immediately (single-use)
  await sql`
    UPDATE email_verifications
    SET used_at = NOW()
    WHERE id = ${record.id}
  `;

  // Update user as verified in both users and profiles tables
  await sql.begin(async (tx: any) => {
    await tx`
      UPDATE users
      SET is_verified = true
      WHERE id = ${record.user_id} OR LOWER(email) = ${cleanEmail}
    `;

    await tx`
      UPDATE profiles
      SET is_verified = true, updated_at = NOW()
      WHERE id = ${record.user_id} OR LOWER(email) = ${cleanEmail}
    `;
  });

  return {
    success: true,
    userId: record.user_id,
    email: cleanEmail,
  };
}
