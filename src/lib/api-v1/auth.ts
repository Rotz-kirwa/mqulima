import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { getDb } from "../db.server";
import { authenticateRequest, signUserToken } from "./auth-helper";
import { performSignUp } from "../api/auth-shop.server";
import { getClientIp, checkLoginRateLimit, checkSignupRateLimit } from "../rate-limit.server";
import { executePasswordRecoveryRequest, executePasswordResetWithCode } from "../auth-recovery-ops.server";
import { writeAuditLog } from "../audit.server";
import { corsJsonResponse, corsOptionsResponse } from "./cors";

export { corsJsonResponse, corsOptionsResponse };

const LoginSchema = z.object({
  identifier: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

const ForgotPasswordSchema = z.object({
  identifier: z.string().trim().min(3, "Email address or phone number is required"),
});

const ResetPasswordSchema = z.object({
  identifier: z.string().trim().min(3, "Email address or phone number is required"),
  code: z.string().trim().regex(/^\d{6}$/, "A valid 6-digit recovery code is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

const RegisterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email address is required"),
  phoneNumber: z.string().min(9, "Valid phone number is required"),
  nationalId: z.string().optional(),
  county: z.string().min(1, "County is required"),
  deliveryLocation: z.string().min(1, "Delivery location is required"),
  farmingType: z.enum(["Crops", "Livestock", "Mixed", "Poultry", "Fish Farming", "Other"]).default("Crops"),
  specifyFarmingType: z.string().optional(),
  farmSizeAcres: z.number().optional().default(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function handleAuthRegister(request: Request): Promise<Response> {
  if (request.method.toUpperCase() === "OPTIONS") {
    return corsOptionsResponse(request);
  }

  try {
    const ip = getClientIp(request);
    await checkSignupRateLimit(ip).catch(() => {});

    const body = await request.json().catch(() => ({}));
    const parseResult = RegisterSchema.safeParse(body);
    if (!parseResult.success) {
      return corsJsonResponse(
        { success: false, error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        400,
        request
      );
    }

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      nationalId,
      county,
      deliveryLocation,
      farmingType,
      specifyFarmingType,
      password,
    } = parseResult.data;

    // Use dual-table insertion logic with welcome SMS dispatch
    const cleanNationalId = nationalId?.trim();
    const res = await performSignUp({
      firstName,
      lastName,
      email,
      phoneNumber,
      nationalId: cleanNationalId && cleanNationalId.toUpperCase() !== "N/A" ? cleanNationalId : undefined,
      county,
      deliveryLocation,
      farmingType,
      specifyFarmingType,
      password,
      terms: true,
    });

    if ("error" in res) {
      return corsJsonResponse(
        { success: false, error: res.error, field: res.field },
        409,
        request
      );
    }

    const userId = res.userId!;
    const token = await signUserToken(userId, email, "farmer");
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    return corsJsonResponse(
      {
        success: true,
        access_token: token,
        token,
        user: {
          id: userId,
          name: fullName,
          email: email.trim().toLowerCase(),
          phone: phoneNumber,
          county,
          role: "farmer",
        },
      },
      201,
      request
    );
  } catch (err: any) {
    console.error("[API/V1/REGISTER ERROR]:", err);
    return corsJsonResponse(
      { success: false, error: err?.message || "Registration failed. Please try again." },
      500,
      request
    );
  }
}

export async function handleAuthLogin(request: Request): Promise<Response> {
  if (request.method.toUpperCase() === "OPTIONS") {
    return corsOptionsResponse(request);
  }

  try {
    const ip = getClientIp(request);
    await checkLoginRateLimit(ip).catch(() => {});

    const body = await request.json().catch(() => ({}));
    const parseResult = LoginSchema.safeParse(body);
    if (!parseResult.success) {
      return corsJsonResponse(
        { success: false, error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        400,
        request
      );
    }

    const { identifier, password } = parseResult.data;
    const ident = identifier.trim();
    const sql = getDb();
    let dbUser;

    if (ident.includes("@")) {
      const cleanEmail = ident.toLowerCase();
      [dbUser] = await sql`
        SELECT id, email, password_hash, full_name, role, county_region, phone
        FROM profiles
        WHERE LOWER(email) = ${cleanEmail} AND deleted_at IS NULL
        LIMIT 1
      `;
    } else {
      const cleanPhone = ident.replace(/\s+/g, "");
      const basePhone = cleanPhone.replace(/^(\+?254|0)/, "");
      [dbUser] = await sql`
        SELECT id, email, password_hash, full_name, role, county_region, phone
        FROM profiles
        WHERE (
          phone = ${cleanPhone}
          OR phone = ${'+254' + basePhone}
          OR phone = ${'254' + basePhone}
          OR phone = ${'0' + basePhone}
          OR phone = ${basePhone}
        ) AND deleted_at IS NULL
        LIMIT 1
      `;
    }

    if (!dbUser) {
      // Also check users table
      const cleanEmail = ident.toLowerCase();
      const cleanPhone = ident.replace(/\s+/g, "");
      const [u] = await sql`
        SELECT id, email, password_hash, first_name, last_name, county, phone_number
        FROM users
        WHERE (LOWER(email) = ${cleanEmail} OR phone_number = ${cleanPhone})
          AND deleted_at IS NULL
        LIMIT 1
      `;
      if (u) {
        dbUser = {
          id: u.id,
          email: u.email,
          password_hash: u.password_hash,
          full_name: `${u.first_name} ${u.last_name}`.trim(),
          role: "farmer",
          county_region: u.county,
          phone: u.phone_number,
        };
      }
    }

    if (!dbUser || !dbUser.password_hash) {
      return corsJsonResponse(
        { success: false, error: "Invalid email/phone number or password." },
        401,
        request
      );
    }

    const isMatch = await bcrypt.compare(password, dbUser.password_hash);
    if (!isMatch) {
      return corsJsonResponse(
        { success: false, error: "Invalid email/phone number or password." },
        401,
        request
      );
    }

    // Update last_login_at in background
    await sql`UPDATE profiles SET last_login_at = NOW() WHERE id = ${dbUser.id}`.catch(() => {});

    const token = await signUserToken(dbUser.id, dbUser.email, dbUser.role || "farmer");

    return corsJsonResponse(
      {
        success: true,
        access_token: token,
        token,
        user: {
          id: dbUser.id,
          name: dbUser.full_name || "Mqulima Farmer",
          email: dbUser.email,
          phone: dbUser.phone || "",
          county: dbUser.county_region || "Kenya",
          role: dbUser.role || "farmer",
        },
      },
      200,
      request
    );
  } catch (err: any) {
    console.error("[API/V1/LOGIN ERROR]:", err);
    return corsJsonResponse(
      { success: false, error: err?.message || "Login failed. Please try again." },
      500,
      request
    );
  }
}

export async function handleAuthMe(request: Request): Promise<Response> {
  if (request.method.toUpperCase() === "OPTIONS") {
    return corsOptionsResponse(request);
  }

  const user = await authenticateRequest(request);
  if (!user) {
    return corsJsonResponse(
      { success: false, error: "Unauthorized. Please sign in to continue." },
      401,
      request
    );
  }

  return corsJsonResponse(
    {
      success: true,
      user,
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      county: user.county || "Kenya",
      role: user.role,
    },
    200,
    request
  );
}

export async function handleUpdateProfile(request: Request): Promise<Response> {
  if (request.method.toUpperCase() === "OPTIONS") {
    return corsOptionsResponse(request);
  }

  const user = await authenticateRequest(request);
  if (!user) {
    return corsJsonResponse(
      { success: false, error: "Unauthorized." },
      401,
      request
    );
  }

  try {
    const body = await request.json();
    const sql = getDb();

    const fullName = body.name || body.fullName || user.name;
    const county = body.county || body.countyRegion || user.county;
    const phone = body.phone || user.phone;
    const avatarUrl = body.avatarUrl || user.avatarUrl || null;
    const crops = body.crops ? (Array.isArray(body.crops) ? body.crops : [body.crops]) : null;
    const livestock = body.livestock ? (Array.isArray(body.livestock) ? body.livestock : [body.livestock]) : null;

    await sql`
      UPDATE profiles
      SET 
        full_name = ${fullName},
        county_region = ${county},
        phone = COALESCE(${phone}, phone),
        avatar_url = COALESCE(${avatarUrl}, avatar_url),
        crops = COALESCE(${crops}, crops),
        livestock = COALESCE(${livestock}, livestock),
        updated_at = NOW()
      WHERE id = ${user.id}
    `;

    return corsJsonResponse(
      {
        success: true,
        message: "Profile updated successfully.",
        user: { ...user, name: fullName, county, phone, avatarUrl },
      },
      200,
      request
    );
  } catch (err: any) {
    return corsJsonResponse(
      { success: false, error: err?.message || "Failed to update profile." },
      500,
      request
    );
  }
}

export async function handleForgotPassword(request: Request): Promise<Response> {
  if (request.method.toUpperCase() === "OPTIONS") {
    return corsOptionsResponse(request);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parseResult = ForgotPasswordSchema.safeParse(body);
    if (!parseResult.success) {
      return corsJsonResponse(
        { success: false, error: "Please enter a valid registered email address or phone number." },
        400,
        request
      );
    }

    const clientIp = getClientIp(request);
    await executePasswordRecoveryRequest({
      identifier: parseResult.data.identifier,
      clientIp,
    });

    // Uniform response regardless of whether the identifier matches an active account
    return corsJsonResponse(
      {
        success: true,
        message: "If an account exists for that email or phone number, a 6-digit recovery code and sign-in instructions have been sent.",
      },
      200,
      request
    );
  } catch (err: any) {
    if (err?.status === 429) {
      return corsJsonResponse(
        { success: false, error: err?.message || "Too many recovery requests. Please try again later." },
        429,
        request
      );
    }
    console.error("[API/V1/FORGOT-PASSWORD ERROR]:", err);
    return corsJsonResponse(
      { success: false, error: "Unable to process password recovery right now. Please try again shortly." },
      500,
      request
    );
  }
}

export async function handleResetPassword(request: Request): Promise<Response> {
  if (request.method.toUpperCase() === "OPTIONS") {
    return corsOptionsResponse(request);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parseResult = ResetPasswordSchema.safeParse(body);
    if (!parseResult.success) {
      return corsJsonResponse(
        { success: false, error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        400,
        request
      );
    }

    const clientIp = getClientIp(request);
    const result = await executePasswordResetWithCode({
      identifier: parseResult.data.identifier,
      code: parseResult.data.code,
      newPassword: parseResult.data.newPassword,
      clientIp,
    });

    return corsJsonResponse(result, 200, request);
  } catch (err: any) {
    const status = typeof err?.status === "number" ? err.status : 400;
    return corsJsonResponse(
      { success: false, error: err?.message || "Failed to reset password." },
      status,
      request
    );
  }
}

export async function handleDeleteAccount(request: Request): Promise<Response> {
  if (request.method.toUpperCase() === "OPTIONS") {
    return corsOptionsResponse(request);
  }

  const user = await authenticateRequest(request);
  if (!user) {
    return corsJsonResponse(
      { success: false, error: "Unauthorized. Please sign in to delete your account." },
      401,
      request
    );
  }

  if (user.role === "admin" || user.role === "super_admin") {
    return corsJsonResponse(
      { success: false, error: "Administrator accounts cannot be self-deleted via the mobile endpoint." },
      403,
      request
    );
  }

  try {
    const sql = getDb();
    const anonSuffix = `${user.id.replace(/[^a-f0-9]/gi, "").slice(0, 12)}_${Date.now()}`;
    const anonymizedEmail = `deleted_${anonSuffix}@deleted.mqulima.local`;
    const anonymizedUsername = `mqulima_deleted_${anonSuffix}`;
    const revokedPasswordSentinel = `$2b$10$revoked${crypto.randomBytes(24).toString("hex")}`;

    await sql.begin(async (tx: any) => {
      const [profileRow] = await tx`
        SELECT id, role, deleted_at
        FROM profiles
        WHERE id = ${user.id}
        FOR UPDATE
      `;

      if (profileRow) {
        if (profileRow.role === "admin" || profileRow.role === "super_admin") {
          const forbiddenErr = new Error("Administrator accounts cannot be self-deleted.") as Error & { status?: number };
          forbiddenErr.status = 403;
          throw forbiddenErr;
        }
        if (profileRow.deleted_at) {
          const goneErr = new Error("Account has already been deleted.") as Error & { status?: number };
          goneErr.status = 404;
          throw goneErr;
        }

        await tx`
          UPDATE profiles
          SET email = ${anonymizedEmail},
              username = ${anonymizedUsername},
              full_name = 'Deleted User',
              phone = NULL,
              id_number = NULL,
              delivery_address = NULL,
              avatar_url = NULL,
              whatsapp_number = NULL,
              bio = NULL,
              website = NULL,
              cover_image = NULL,
              crops = '{}',
              livestock = '{}',
              password_hash = ${revokedPasswordSentinel},
              status = 'deleted',
              deleted_at = NOW(),
              updated_at = NOW()
          WHERE id = ${user.id}
        `;
      }

      await tx`
        UPDATE users
        SET email = ${anonymizedEmail},
            first_name = 'Deleted',
            last_name = 'User',
            phone_number = NULL,
            national_id = NULL,
            delivery_location = 'Deleted',
            landmark = NULL,
            password_hash = ${revokedPasswordSentinel},
            status = 'deleted',
            deleted_at = NOW()
        WHERE id = ${user.id}
      `.catch(() => {});

      await tx`DELETE FROM recovery_tokens WHERE user_id = ${user.id}`.catch(() => {});
      await tx`DELETE FROM email_verifications WHERE user_id = ${user.id}`.catch(() => {});
    });

    await writeAuditLog({
      actorId: user.id,
      action: "account.deleted",
      ipAddress: getClientIp(request),
      entityType: "profile",
      entityId: user.id,
      diff: { anonymized: true, retainedFinancialRecords: true },
    }).catch(() => {});

    const secureCookieFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return corsJsonResponse(
      {
        success: true,
        deleted: true,
        message: "Your account has been permanently deleted and personal data anonymized. Statutory financial records are retained as required by law.",
      },
      200,
      request,
      {
        "Set-Cookie": `mq_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secureCookieFlag}`,
      }
    );
  } catch (err: any) {
    if (err?.status === 403 || err?.status === 404) {
      return corsJsonResponse({ success: false, error: err.message }, err.status, request);
    }
    console.error("[API/V1/ACCOUNT DELETE ERROR]:", err);
    return corsJsonResponse(
      { success: false, error: "Failed to delete account cleanly. Please contact mqulima@mqulima.com." },
      500,
      request
    );
  }
}
