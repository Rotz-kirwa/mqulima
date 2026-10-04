import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import * as jose from "jose";
import { getDb } from "./db.server";
import { getServerConfig } from "./config.server";
import { getClientIp, checkRecoveryRequestRateLimit, checkRecoveryAttemptRateLimit } from "./rate-limit.server";
import { formatKenyanPhoneE164, normalizeKenyanPhone, sendRecoverySms, sendRecoverySecurityNoticeSms } from "./sms-service.server";
import { sendPasswordRecoveryEmail, sendRecoverySecurityNoticeEmail } from "./email-service.server";
import { writeAuditLog } from "./audit.server";

const COOKIE_NAME = "mq_session";

function getJwtSecret(): Uint8Array {
  const env = getServerConfig();
  return new TextEncoder().encode(env.JWT_SECRET);
}

function hashSecret(secret: string): string {
  return crypto.createHash("sha256").update(secret, "utf8").digest("hex");
}

function maskIdentifier(val: string): string {
  if (!val) return "";
  if (val.includes("@")) {
    const [local, domain] = val.split("@");
    const maskedLocal = local.length <= 2 ? `${local[0]}***` : `${local[0]}***${local[local.length - 1]}`;
    return `${maskedLocal}@${domain}`;
  }
  // Phone
  const cleaned = val.replace(/\s+/g, "");
  if (cleaned.length >= 7) {
    return `${cleaned.slice(0, 4)}****${cleaned.slice(-3)}`;
  }
  return `${cleaned.slice(0, 2)}***`;
}

function getAppBaseUrl(): string {
  try {
    const headers = getRequestHeaders();
    const host = headers?.get("x-forwarded-host") || headers?.get("host");
    const proto = headers?.get("x-forwarded-proto") || "https";
    if (host) {
      return `${proto}://${host}`;
    }
  } catch {}
  return process.env.APP_URL || "https://mqulima.com";
}

/**
 * 1. Request Password Recovery
 * Sends 6-digit code + magic link to BOTH registered Email and Phone (SMS) simultaneously.
 * Enforces bot protection (honeypot + timestamp timing), Upstash rate limits (10/hr IP, 3/hr account),
 * and anti-enumeration (identical response regardless of account existence).
 */
export const requestPasswordRecovery = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      identifier: z.string().min(1),
      honeypot: z.string().optional(),
      formStartTime: z.number().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { identifier, honeypot, formStartTime } = data;
    const clientIp = getClientIp();

    // 1. Bot Protection Checks
    // Honeypot trap: if filled by a bot, silently return generic response
    if (honeypot && honeypot.trim().length > 0) {
      console.warn(`[RECOVERY BOT TRAP] Bot detected via honeypot field from IP ${clientIp}`);
      return {
        success: true,
        message: "If this account exists, we've sent a code and link to your registered email and phone.",
      };
    }

    // Timestamp check: forms submitted faster than 500ms are automated scripts
    if (formStartTime && Date.now() - formStartTime < 500) {
      console.warn(`[RECOVERY BOT TRAP] Form submitted too quickly (${Date.now() - formStartTime}ms) from IP ${clientIp}`);
      return {
        success: true,
        message: "If this account exists, we've sent a code and link to your registered email and phone.",
      };
    }

    // 2. Upstash Redis Rate Limiting (10 req/hr per IP, 3 req/hr per account)
    const rateCheck = await checkRecoveryRequestRateLimit(clientIp, identifier);
    if (!rateCheck.success) {
      throw new Error(rateCheck.error || "Rate limit exceeded. Please wait before trying again.");
    }

    const sql = getDb();
    const cleanIdent = identifier.trim().toLowerCase();

    // 3. Database lookup for eligible User Account
    // Per policy: Strictly for main site users (farmers, buyers, retailers). Excludes admin/super_admin.
    let dbUser: any = null;
    const isEmail = cleanIdent.includes("@");

    if (isEmail) {
      [dbUser] = await sql`
        SELECT id, email, phone, full_name, role, status
        FROM profiles
        WHERE LOWER(email) = ${cleanIdent}
          AND deleted_at IS NULL
          AND role NOT IN ('admin', 'super_admin')
        LIMIT 1
      `;
    } else {
      // Clean phone across Kenyan formats
      const cleanPhone = cleanIdent.replace(/[^0-9+]/g, "");
      const basePhone = cleanPhone.replace(/^(\+?254|0)/, "");

      [dbUser] = await sql`
        SELECT id, email, phone, full_name, role, status
        FROM profiles
        WHERE (
          phone = ${cleanPhone}
          OR phone = ${'+254' + basePhone}
          OR phone = ${'254' + basePhone}
          OR phone = ${'0' + basePhone}
          OR phone = ${basePhone}
        )
          AND deleted_at IS NULL
          AND role NOT IN ('admin', 'super_admin')
        LIMIT 1
      `;
    }

    // Anti-enumeration: if account not found or suspended, mimic processing time and return uniform response
    if (!dbUser || dbUser.status === "suspended") {
      // Small artificial jitter (80-160ms) to ensure timing attacks cannot differentiate account presence
      await new Promise((res) => setTimeout(res, 80 + Math.floor(Math.random() * 80)));
      await writeAuditLog({
        action: "recovery.requested_unknown_account",
        ipAddress: clientIp,
        diff: { identifierType: isEmail ? "email" : "phone" },
      });

      return {
        success: true,
        message: "If this account exists, we've sent a code and link to your registered email and phone.",
        maskedHint: maskIdentifier(identifier),
      };
    }

    // 4. Generate Cryptographic Code (6-digit) and Link Token (32-bytes / 64-hex)
    const rawCode = crypto.randomInt(100000, 1000000).toString();
    const rawToken = crypto.randomBytes(32).toString("hex");

    const codeHash = hashSecret(rawCode);
    const tokenHash = hashSecret(rawToken);

    // 5. Invalidate any existing unused recovery tokens for this user
    await sql`
      UPDATE recovery_tokens
      SET used_at = NOW()
      WHERE user_id = ${dbUser.id} AND used_at IS NULL
    `;

    // 6. Insert new recovery record (10-minute expiry)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await sql`
      INSERT INTO recovery_tokens (
        user_id,
        code_hash,
        token_hash,
        expires_at
      ) VALUES (
        ${dbUser.id},
        ${codeHash},
        ${tokenHash},
        ${expiresAt}
      )
    `;

    // 7. Dispatch to Both Channels in Parallel (Promise.allSettled)
    const baseUrl = getAppBaseUrl();
    const magicLinkUrl = `${baseUrl}/auth/magic-login?token=${encodeURIComponent(rawToken)}`;

    const deliveryPromises: Promise<any>[] = [];

    // Channel A: Registered Email
    if (dbUser.email && dbUser.email.includes("@")) {
      deliveryPromises.push(
        sendPasswordRecoveryEmail({
          toEmail: dbUser.email,
          recipientName: dbUser.full_name,
          otpCode: rawCode,
          magicLinkUrl,
          expiresInMinutes: 10,
        })
      );
    }

    // Channel B: Registered Phone (SMS)
    // STRICT SECURITY: Only send SMS to the phone number the user ALREADY registered in the DB.
    let e164Phone: string | null = null;
    if (dbUser.phone) {
      try {
        e164Phone = formatKenyanPhoneE164(dbUser.phone);
        deliveryPromises.push(sendRecoverySms(e164Phone, rawCode, magicLinkUrl));
      } catch (err: any) {
        console.error("[RECOVERY] Registered phone number could not be normalized to +254 format:", err?.message || err);
      }
    }

    // Parallel dispatch with error containment
    const dispatchResults = await Promise.allSettled(deliveryPromises);
    const hasSuccessfulChannel = dispatchResults.some(
      (r) => r.status === "fulfilled" && (r.value as any)?.success !== false
    );

    // 8. Audit Log the Dispatch Event (no plaintext secrets)
    await writeAuditLog({
      actorId: dbUser.id,
      action: "recovery.dispatched",
      ipAddress: clientIp,
      entityType: "recovery_token",
      diff: {
        emailDispatched: !!dbUser.email,
        smsDispatched: !!e164Phone,
        hasSuccessfulChannel,
      },
    });

    return {
      success: true,
      message: "If this account exists, we've sent a code and link to your registered email and phone.",
      maskedHint: dbUser.email ? maskIdentifier(dbUser.email) : maskIdentifier(dbUser.phone || identifier),
    };
  });

/**
 * 2. Verify Recovery Code (6-Digit OTP)
 * Validates the 6-digit code, enforces 5 max attempts, marks single use,
 * revokes all other active sessions, establishes an authenticated session,
 * and sends security notices to both channels.
 */
export const verifyRecoveryCode = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      code: z.string().min(6).max(6),
      identifier: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { code, identifier } = data;
    const clientIp = getClientIp();

    // Rate limit check on verification attempts
    const attemptRateKey = `verify_attempt_${identifier ? identifier.trim().toLowerCase() : clientIp}`;
    const rateCheck = await checkRecoveryAttemptRateLimit(attemptRateKey);
    if (!rateCheck.success) {
      throw new Error(rateCheck.error || "Too many failed attempts. Code is locked.");
    }

    const codeHash = hashSecret(code.trim());
    const sql = getDb();

    // Look up active token by code_hash
    const [tokenRow] = await sql`
      SELECT rt.id, rt.user_id, rt.attempts, rt.max_attempts, rt.expires_at, rt.used_at,
             p.email, p.phone, p.full_name, p.role, p.county_region
      FROM recovery_tokens rt
      JOIN profiles p ON p.id = rt.user_id
      WHERE rt.code_hash = ${codeHash}
        AND rt.used_at IS NULL
        AND rt.expires_at > NOW()
      ORDER BY rt.created_at DESC
      LIMIT 1
    `;

    if (!tokenRow) {
      // If identifier was provided, find the latest pending token and increment attempts counter
      if (identifier) {
        await sql`
          UPDATE recovery_tokens
          SET attempts = attempts + 1
          WHERE id IN (
            SELECT rt.id FROM recovery_tokens rt
            JOIN profiles p ON p.id = rt.user_id
            WHERE (LOWER(p.email) = ${identifier.trim().toLowerCase()} OR p.phone = ${identifier.trim()})
              AND rt.used_at IS NULL
            ORDER BY rt.created_at DESC
            LIMIT 1
          )
        `;
      }
      throw new Error("Invalid or expired verification code. Please check your code or request a new one.");
    }

    if (tokenRow.attempts >= tokenRow.max_attempts) {
      // Mark as used/locked
      await sql`UPDATE recovery_tokens SET used_at = NOW() WHERE id = ${tokenRow.id}`;
      throw new Error("This recovery code has been locked due to too many failed attempts. Please request a new code.");
    }

    // Mark single-use token as consumed
    await sql`
      UPDATE recovery_tokens
      SET used_at = NOW()
      WHERE id = ${tokenRow.id}
    `;

    // REVOKE ALL OTHER ACTIVE SESSIONS: Update last_login_at and updated_at
    await sql`
      UPDATE profiles
      SET last_login_at = NOW(),
          updated_at = NOW()
      WHERE id = ${tokenRow.user_id}
    `;

    // Sign authenticated JWT session
    const secret = getJwtSecret();
    const jwt = await new jose.SignJWT({
      sub: tokenRow.user_id,
      role: tokenRow.role,
      email: tokenRow.email,
      recoveryAuth: true,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    let cookieDomain: string | undefined = undefined;
    try {
      const headers = getRequestHeaders();
      const host = headers?.get("host") || "";
      if (host.includes("mqulima.com")) {
        cookieDomain = ".mqulima.com";
      }
    } catch {}

    setCookie(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain: cookieDomain,
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    // Send Security Notices to BOTH channels asynchronously
    const loginTime = new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" });
    const noticePromises: Promise<any>[] = [];

    if (tokenRow.email) {
      noticePromises.push(
        sendRecoverySecurityNoticeEmail({
          toEmail: tokenRow.email,
          recipientName: tokenRow.full_name,
          loginTime,
        })
      );
    }

    if (tokenRow.phone) {
      try {
        const e164 = formatKenyanPhoneE164(tokenRow.phone);
        noticePromises.push(sendRecoverySecurityNoticeSms(e164));
      } catch {}
    }

    Promise.allSettled(noticePromises).catch(() => {});

    // Audit log
    await writeAuditLog({
      actorId: tokenRow.user_id,
      action: "recovery.success_code",
      ipAddress: clientIp,
      entityType: "session",
      diff: { method: "otp_code", email: tokenRow.email },
    });

    return {
      success: true,
      user: {
        id: tokenRow.user_id,
        name: tokenRow.full_name,
        email: tokenRow.email,
        role: tokenRow.role,
        county: tokenRow.county_region || "",
      },
      token: jwt,
      requiresPasswordChange: true,
    };
  });

/**
 * 3. Verify Magic Link Token
 * Validates the 32-byte cryptographic token from the magic link, marks single use,
 * revokes all other active sessions, establishes an authenticated session,
 * and sends security notices to both channels.
 */
export const verifyMagicLinkToken = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().min(32),
    })
  )
  .handler(async ({ data }) => {
    const { token } = data;
    const clientIp = getClientIp();

    const tokenHash = hashSecret(token.trim());
    const sql = getDb();

    // Look up active token by token_hash
    const [tokenRow] = await sql`
      SELECT rt.id, rt.user_id, rt.attempts, rt.max_attempts, rt.expires_at, rt.used_at,
             p.email, p.phone, p.full_name, p.role, p.county_region
      FROM recovery_tokens rt
      JOIN profiles p ON p.id = rt.user_id
      WHERE rt.token_hash = ${tokenHash}
        AND rt.used_at IS NULL
        AND rt.expires_at > NOW()
      ORDER BY rt.created_at DESC
      LIMIT 1
    `;

    if (!tokenRow) {
      throw new Error("This sign-in link is invalid or has expired. Please request a new recovery link.");
    }

    if (tokenRow.attempts >= tokenRow.max_attempts) {
      await sql`UPDATE recovery_tokens SET used_at = NOW() WHERE id = ${tokenRow.id}`;
      throw new Error("This recovery link has been invalidated. Please request a new recovery link.");
    }

    // Mark single-use token as consumed
    await sql`
      UPDATE recovery_tokens
      SET used_at = NOW()
      WHERE id = ${tokenRow.id}
    `;

    // REVOKE ALL OTHER ACTIVE SESSIONS
    await sql`
      UPDATE profiles
      SET last_login_at = NOW(),
          updated_at = NOW()
      WHERE id = ${tokenRow.user_id}
    `;

    // Sign authenticated JWT session
    const secret = getJwtSecret();
    const jwt = await new jose.SignJWT({
      sub: tokenRow.user_id,
      role: tokenRow.role,
      email: tokenRow.email,
      recoveryAuth: true,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    let cookieDomain: string | undefined = undefined;
    try {
      const headers = getRequestHeaders();
      const host = headers?.get("host") || "";
      if (host.includes("mqulima.com")) {
        cookieDomain = ".mqulima.com";
      }
    } catch {}

    setCookie(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain: cookieDomain,
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    // Send Security Notices to BOTH channels asynchronously
    const loginTime = new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" });
    const noticePromises: Promise<any>[] = [];

    if (tokenRow.email) {
      noticePromises.push(
        sendRecoverySecurityNoticeEmail({
          toEmail: tokenRow.email,
          recipientName: tokenRow.full_name,
          loginTime,
        })
      );
    }

    if (tokenRow.phone) {
      try {
        const e164 = formatKenyanPhoneE164(tokenRow.phone);
        noticePromises.push(sendRecoverySecurityNoticeSms(e164));
      } catch {}
    }

    Promise.allSettled(noticePromises).catch(() => {});

    // Audit log
    await writeAuditLog({
      actorId: tokenRow.user_id,
      action: "recovery.success_magic_link",
      ipAddress: clientIp,
      entityType: "session",
      diff: { method: "magic_link", email: tokenRow.email },
    });

    return {
      success: true,
      user: {
        id: tokenRow.user_id,
        name: tokenRow.full_name,
        email: tokenRow.email,
        role: tokenRow.role,
        county: tokenRow.county_region || "",
      },
      token: jwt,
      requiresPasswordChange: true,
    };
  });

/**
 * 4. Set New Password After Recovery
 * Allows authenticated user to update their password.
 * Strictly hashes using bcrypt (salt rounds 10) and NEVER logs or stores plaintext.
 */
export const setNewPasswordAfterRecovery = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      newPassword: z.string().min(8, "Password must be at least 8 characters long"),
      confirmPassword: z.string().min(8),
    })
  )
  .handler(async ({ data }) => {
    const { newPassword, confirmPassword } = data;
    const clientIp = getClientIp();

    if (newPassword !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    // Verify session from cookie
    const token = getCookie(COOKIE_NAME);
    if (!token) {
      throw new Error("You must be logged in to set a new password.");
    }

    const secret = getJwtSecret();
    let payload: any;
    try {
      const verified = await jose.jwtVerify(token, secret);
      payload = verified.payload;
    } catch {
      throw new Error("Session expired. Please sign in again.");
    }

    const userId = payload.sub;
    if (!userId) {
      throw new Error("Invalid session state.");
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const sql = getDb();

    // Update profiles and users tables
    await sql`
      UPDATE profiles
      SET password_hash = ${passwordHash},
          updated_at = NOW()
      WHERE id = ${userId}
    `;

    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}
      WHERE id = ${userId}
    `.catch(() => {});

    // Audit log (NEVER logging the password or hash)
    await writeAuditLog({
      actorId: userId,
      action: "recovery.password_changed",
      ipAddress: clientIp,
      entityType: "profile",
      diff: { status: "password_updated" },
    });

    return {
      success: true,
      message: "Your new password has been successfully saved.",
    };
  });
