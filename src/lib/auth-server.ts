import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import * as jose from "jose";
import { type User } from "./auth-types";

const COOKIE_NAME = "mq_session";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

import { SignUpSchema } from "./auth-shop-shared";

export const loginUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    identifier: z.string().min(1),
    password: z.string().min(1),
    csrfToken: z.string(),
    rememberMe: z.boolean().optional(),
  }))
  .handler(async ({ data }) => {
    const { identifier, password, csrfToken, rememberMe } = data;

    // 1. CSRF Token Validation
    const { validateCsrfToken } = await import("./csrf-verify.server");
    validateCsrfToken(csrfToken);

    // 2. Rate Limiting Check
    const { getClientIp, checkLoginRateLimit } = await import("./rate-limit.server");
    const ip = getClientIp();
    await checkLoginRateLimit(ip);

    const { getDb } = await import("./db.server");
    const sql = getDb();

    const ident = identifier.trim();
    let dbUser;

    // Auto-detect email or phone
    if (ident.includes("@")) {
      const cleanEmail = ident.toLowerCase();
      [dbUser] = await sql`
        SELECT id, email, password_hash, full_name, role
        FROM profiles
        WHERE LOWER(email) = ${cleanEmail} AND deleted_at IS NULL
      `;
    } else {
      // Standardize phone number by removing spaces
      const cleanPhone = ident.replace(/\s+/g, "");
      [dbUser] = await sql`
        SELECT id, email, password_hash, full_name, role
        FROM profiles
        WHERE (phone = ${cleanPhone} OR phone = ${'+254' + cleanPhone} OR phone = ${'0' + cleanPhone}) AND deleted_at IS NULL
      `;
    }

    if (!dbUser) {
      throw new Error("Invalid email/phone number or password");
    }

    // Verify bcrypt hash
    const isValid = await bcrypt.compare(password, dbUser.password_hash);
    if (!isValid) {
      throw new Error("Invalid email/phone number or password");
    }

    // Update last_login_at
    await sql`
      UPDATE profiles
      SET last_login_at = NOW()
      WHERE id = ${dbUser.id}
    `;

    // Sign JWT
    const secret = getJwtSecret();
    const jwt = await new jose.SignJWT({ sub: dbUser.id, role: dbUser.role, email: dbUser.email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(rememberMe ? "30d" : "7d")
      .sign(secret);

    // Set cookie
    setCookie(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
    });

    // 3. Successful Login Audit Log
    const { writeAuditLog } = await import("./audit.server");
    await writeAuditLog({
      actorId: dbUser.id,
      action: "auth.login",
      entityType: "session",
      entityId: dbUser.id,
      diff: { email: dbUser.email, role: dbUser.role }
    });

    return {
      success: true,
      user: {
        id: dbUser.id,
        name: dbUser.full_name,
        email: dbUser.email,
        role: dbUser.role,
      }
    };
  });

export const registerUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    data: SignUpSchema,
    csrfToken: z.string(),
  }))
  .handler(async ({ data }) => {
    const { data: signUpData, csrfToken } = data;

    // 1. CSRF Token Validation
    const { validateCsrfToken } = await import("./csrf-verify.server");
    validateCsrfToken(csrfToken);

    // 2. Rate Limiting Check
    const { getClientIp, checkLoginRateLimit } = await import("./rate-limit.server");
    const ip = getClientIp();
    await checkLoginRateLimit(ip);

    // 3. Perform Sign Up insertion
    const { performSignUp } = await import("./api/auth-shop.server");
    const res = await performSignUp(signUpData);
    if ("error" in res) {
      throw new Error(JSON.stringify({ error: res.error, field: res.field }));
    }

    // 4. Successful Registration Audit Log
    const { writeAuditLog } = await import("./audit.server");
    await writeAuditLog({
      actorId: res.userId!,
      action: "auth.register",
      entityType: "profile",
      entityId: res.userId!,
      diff: { email: signUpData.email, phone: signUpData.phoneNumber }
    });

    // 5. Auto-Login: Sign JWT and Set Session Cookie
    const secret = getJwtSecret();
    const jwt = await new jose.SignJWT({ sub: res.userId!, role: "farmer", email: signUpData.email.trim().toLowerCase() })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    setCookie(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return {
      success: true,
      userId: res.userId,
    };
  });

export const logoutUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    csrfToken: z.string()
  }))
  .handler(async ({ data }) => {
    const { csrfToken } = data;
    
    // 1. CSRF Token Validation
    const { validateCsrfToken } = await import("./csrf-verify.server");
    validateCsrfToken(csrfToken);

    setCookie(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return { success: true };
  });

export const getCurrentUser = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = getCookie(COOKIE_NAME);
    if (!token) {
      return null;
    }

    try {
      const secret = getJwtSecret();
      const { payload } = await jose.jwtVerify(token, secret);
      const userId = (payload.sub || payload.id) as string;

      const { getDb } = await import("./db.server");
      const sql = getDb();
      const [dbUser] = await sql`
        SELECT id, email, full_name, county_region, years_farming, crops, livestock, role
        FROM profiles
        WHERE id = ${userId} AND deleted_at IS NULL
      `;

      if (!dbUser) {
        return null;
      }

      const user: User = {
        id: dbUser.id,
        name: dbUser.full_name,
        email: dbUser.email,
        county: dbUser.county_region || "",
        farmSize: `${dbUser.years_farming || 0} years`,
        crops: dbUser.crops ? dbUser.crops.join(", ") : "",
        livestock: dbUser.livestock ? dbUser.livestock.join(", ") : "",
        role: dbUser.role,
      };

      return user;
    } catch (e) {
      return null;
    }
  });
