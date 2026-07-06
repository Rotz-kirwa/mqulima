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

export const loginUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    email: z.string().email(),
    password: z.string().min(1),
    csrfToken: z.string()
  }))
  .handler(async ({ data }) => {
    const { email, password, csrfToken } = data;

    // 1. CSRF Token Validation
    const { validateCsrfToken } = await import("./csrf-verify.server");
    validateCsrfToken(csrfToken);

    // 2. Rate Limiting Check
    const { getClientIp, checkLoginRateLimit } = await import("./rate-limit.server");
    const ip = getClientIp();
    await checkLoginRateLimit(ip);

    const { getDb } = await import("./db.server");
    const sql = getDb();

    // Query profiles table
    const [dbUser] = await sql`
      SELECT id, email, password_hash, full_name, role
      FROM profiles
      WHERE LOWER(email) = LOWER(${email.trim()}) AND deleted_at IS NULL
    `;

    if (!dbUser) {
      throw new Error("Invalid credentials");
    }

    // Verify bcrypt hash
    const isValid = await bcrypt.compare(password, dbUser.password_hash);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    // Sign JWT
    const secret = getJwtSecret();
    const jwt = await new jose.SignJWT({ sub: dbUser.id, role: dbUser.role, email: dbUser.email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    // Set cookie
    setCookie(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
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
