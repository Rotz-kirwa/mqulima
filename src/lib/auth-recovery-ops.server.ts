import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { getDb } from "./db.server";
import { getClientIp, checkRecoveryRequestRateLimit, checkRecoveryAttemptRateLimit } from "./rate-limit.server";
import { formatKenyanPhoneE164, sendRecoverySms, sendRecoverySecurityNoticeSms } from "./sms-service.server";
import { sendPasswordRecoveryEmail, sendRecoverySecurityNoticeEmail } from "./email-service.server";
import { writeAuditLog } from "./audit.server";

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
  const cleaned = val.replace(/\s+/g, "");
  if (cleaned.length >= 7) {
    return `${cleaned.slice(0, 4)}****${cleaned.slice(-3)}`;
  }
  return `${cleaned.slice(0, 2)}***`;
}

export async function executePasswordRecoveryRequest(params: {
  identifier: string;
  clientIp?: string;
  appBaseUrl?: string;
}): Promise<{ success: true; message: string; maskedHint?: string }> {
  const { identifier } = params;
  const clientIp = params.clientIp || getClientIp();

  const rateCheck = await checkRecoveryRequestRateLimit(clientIp, identifier);
  if (!rateCheck.success) {
    const err = new Error(rateCheck.error || "Rate limit exceeded. Please wait before trying again.") as Error & { status?: number };
    err.status = 429;
    throw err;
  }

  const sql = getDb();
  const cleanIdent = identifier.trim().toLowerCase();
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

  if (!dbUser || dbUser.status === "suspended" || dbUser.status === "deleted") {
    await new Promise((res) => setTimeout(res, 80 + Math.floor(Math.random() * 80)));
    await writeAuditLog({
      action: "recovery.requested_unknown_account",
      ipAddress: clientIp,
      diff: { identifierType: isEmail ? "email" : "phone" },
    }).catch(() => {});

    return {
      success: true,
      message: "If this account exists, we've sent a code and link to your registered email and phone.",
      maskedHint: maskIdentifier(identifier),
    };
  }

  const rawCode = crypto.randomInt(100000, 1000000).toString();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const codeHash = hashSecret(rawCode);
  const tokenHash = hashSecret(rawToken);

  await sql`
    UPDATE recovery_tokens
    SET used_at = NOW()
    WHERE user_id = ${dbUser.id} AND used_at IS NULL
  `;

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

  const baseUrl = params.appBaseUrl || process.env.APP_URL || "https://www.mqulima.com";
  const magicLinkUrl = `${baseUrl}/auth/magic-login?token=${encodeURIComponent(rawToken)}`;
  const deliveryPromises: Promise<any>[] = [];

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

  let e164Phone: string | null = null;
  if (dbUser.phone) {
    try {
      e164Phone = formatKenyanPhoneE164(dbUser.phone);
      deliveryPromises.push(sendRecoverySms(e164Phone, rawCode, magicLinkUrl));
    } catch (err: any) {
      console.error("[RECOVERY] Registered phone number could not be normalized to +254 format:", err?.message || err);
    }
  }

  const dispatchResults = await Promise.allSettled(deliveryPromises);
  const hasSuccessfulChannel = dispatchResults.some(
    (r) => r.status === "fulfilled" && (r.value as any)?.success !== false
  );

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
  }).catch(() => {});

  return {
    success: true,
    message: "If this account exists, we've sent a code and link to your registered email and phone.",
    maskedHint: maskIdentifier(identifier),
  };
}

export async function executePasswordResetWithCode(params: {
  identifier: string;
  code: string;
  newPassword: string;
  clientIp?: string;
}): Promise<{ success: true; message: string }> {
  const { identifier, code, newPassword } = params;
  const clientIp = params.clientIp || getClientIp();
  const cleanIdent = identifier.trim().toLowerCase();
  const attemptRateKey = `verify_attempt_${cleanIdent || clientIp}`;
  const rateCheck = await checkRecoveryAttemptRateLimit(attemptRateKey);
  if (!rateCheck.success) {
    const err = new Error(rateCheck.error || "Too many failed attempts. Code is locked.") as Error & { status?: number };
    err.status = 429;
    throw err;
  }

  const codeHash = hashSecret(code.trim());
  const sql = getDb();
  const isEmail = cleanIdent.includes("@");
  const cleanPhone = cleanIdent.replace(/[^0-9+]/g, "");
  const basePhone = cleanPhone.replace(/^(\+?254|0)/, "");

  const [tokenRow] = await sql`
    SELECT rt.id, rt.user_id, rt.attempts, rt.max_attempts,
           p.email, p.phone, p.full_name, p.role
    FROM recovery_tokens rt
    JOIN profiles p ON p.id = rt.user_id
    WHERE rt.code_hash = ${codeHash}
      AND rt.used_at IS NULL
      AND rt.expires_at > NOW()
      AND p.deleted_at IS NULL
      AND p.role NOT IN ('admin', 'super_admin')
      AND (
        (${isEmail} AND LOWER(p.email) = ${cleanIdent})
        OR (NOT ${isEmail} AND (
          p.phone = ${cleanPhone}
          OR p.phone = ${'+254' + basePhone}
          OR p.phone = ${'254' + basePhone}
          OR p.phone = ${'0' + basePhone}
          OR p.phone = ${basePhone}
        ))
      )
    ORDER BY rt.created_at DESC
    LIMIT 1
  `;

  if (!tokenRow) {
    await sql`
      UPDATE recovery_tokens
      SET attempts = attempts + 1
      WHERE id IN (
        SELECT rt.id FROM recovery_tokens rt
        JOIN profiles p ON p.id = rt.user_id
        WHERE (LOWER(p.email) = ${cleanIdent} OR p.phone = ${cleanPhone} OR p.phone = ${'0' + basePhone} OR p.phone = ${'+254' + basePhone})
          AND rt.used_at IS NULL
        ORDER BY rt.created_at DESC
        LIMIT 1
      )
    `.catch(() => {});
    const err = new Error("Invalid or expired recovery code.") as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  if (tokenRow.attempts >= tokenRow.max_attempts) {
    await sql`UPDATE recovery_tokens SET used_at = NOW() WHERE id = ${tokenRow.id}`;
    const err = new Error("This recovery code has been locked due to too many failed attempts. Please request a new code.") as Error & { status?: number };
    err.status = 429;
    throw err;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await sql.begin(async (tx: any) => {
    const consumed = await tx`
      UPDATE recovery_tokens
      SET used_at = NOW()
      WHERE id = ${tokenRow.id} AND used_at IS NULL
      RETURNING id
    `;
    if (!consumed.length) {
      throw new Error("Recovery code was already used.");
    }

    await tx`
      UPDATE profiles
      SET password_hash = ${passwordHash},
          last_login_at = NOW(),
          updated_at = NOW()
      WHERE id = ${tokenRow.user_id}
    `;

    await tx`
      UPDATE users
      SET password_hash = ${passwordHash}
      WHERE id = ${tokenRow.user_id}
    `.catch(() => {});
  });

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

  await writeAuditLog({
    actorId: tokenRow.user_id,
    action: "recovery.password_reset_mobile",
    ipAddress: clientIp,
    entityType: "profile",
    diff: { status: "password_updated" },
  }).catch(() => {});

  return {
    success: true,
    message: "Your password has been updated. Please sign in with your new password.",
  };
}

