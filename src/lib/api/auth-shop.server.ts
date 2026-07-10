import { createServerFn } from "@tanstack/react-start";
import { setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import * as jose from "jose";
import { getDb } from "@/lib/db.server";

const COOKIE_NAME = "mq_session";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

import { SignUpSchema, SignInSchema } from "@/lib/auth-shop-shared";

export interface AuthErrorResponse {
  error: string;
  field?: "email" | "phoneNumber" | "nationalId" | "identifier" | "password";
}

// Core business logic to register a shop user
export async function performSignUp(data: z.infer<typeof SignUpSchema>): Promise<{ success: boolean; userId?: string } | AuthErrorResponse> {
  const sql = getDb();
  
  // Clean values for insertion
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanPhone = data.phoneNumber.replace(/\s+/g, ""); // Remove formatting spaces e.g. +2547XXXXXXXX
  const cleanId = data.nationalId.trim();

  // 1. Conflict Check: Email
  const [existingEmail] = await sql`SELECT 1 FROM users WHERE LOWER(email) = ${cleanEmail}`;
  if (existingEmail) {
    return { error: "An account with this email already exists", field: "email" };
  }

  // 2. Conflict Check: Phone
  const [existingPhone] = await sql`SELECT 1 FROM users WHERE phone_number = ${cleanPhone}`;
  if (existingPhone) {
    return { error: "An account with this phone number already exists", field: "phoneNumber" };
  }

  // 3. Conflict Check: National ID
  const [existingId] = await sql`SELECT 1 FROM users WHERE national_id = ${cleanId}`;
  if (existingId) {
    return { error: "An account with this national ID already exists", field: "nationalId" };
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Insert user
  const [newUser] = await sql`
    INSERT INTO users (
      first_name,
      last_name,
      phone_number,
      email,
      national_id,
      county,
      delivery_location,
      landmark,
      farming_type,
      specify_farming_type,
      password_hash
    ) VALUES (
      ${data.firstName.trim()},
      ${data.lastName.trim()},
      ${cleanPhone},
      ${cleanEmail},
      ${cleanId},
      ${data.county},
      ${data.deliveryLocation.trim()},
      ${data.landmark?.trim() || null},
      ${data.farmingType},
      ${data.specifyFarmingType?.trim() || null},
      ${passwordHash}
    )
    RETURNING id
  `;

  return { success: true, userId: newUser.id };
}

// Core business logic to sign in a shop user
export async function performSignIn(data: z.infer<typeof SignInSchema>): Promise<{ success: boolean; user?: any } | AuthErrorResponse> {
  const sql = getDb();
  const ident = data.identifier.trim();
  
  let dbUser;
  
  // Auto-detect email or phone
  if (ident.includes("@")) {
    const cleanEmail = ident.toLowerCase();
    [dbUser] = await sql`
      SELECT id, first_name, last_name, email, phone_number, password_hash
      FROM users
      WHERE LOWER(email) = ${cleanEmail}
    `;
  } else {
    // Standardize phone number by removing spaces
    const cleanPhone = ident.replace(/\s+/g, "");
    [dbUser] = await sql`
      SELECT id, first_name, last_name, email, phone_number, password_hash
      FROM users
      WHERE phone_number = ${cleanPhone} OR phone_number = ${'+254' + cleanPhone} OR phone_number = ${'0' + cleanPhone}
    `;
  }

  if (!dbUser) {
    return { error: "Invalid email/phone number or password", field: "identifier" };
  }

  // Compare bcrypt
  const isValid = await bcrypt.compare(data.password, dbUser.password_hash);
  if (!isValid) {
    return { error: "Invalid email/phone number or password", field: "password" };
  }

  // Sign JWT
  const secret = getJwtSecret();
  const jwt = await new jose.SignJWT({ sub: dbUser.id, role: "farmer", email: dbUser.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(data.rememberMe ? "30d" : "7d")
    .sign(secret);

  // Set Cookie
  setCookie(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: data.rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
  });

  return {
    success: true,
    user: {
      id: dbUser.id,
      name: `${dbUser.first_name} ${dbUser.last_name}`,
      email: dbUser.email,
      phone: dbUser.phone_number,
      role: "farmer"
    }
  };
}

// TanStack Start Direct Server Functions
export const signUpShopFn = createServerFn({ method: "POST" })
  .inputValidator(SignUpSchema)
  .handler(async ({ data }) => {
    const res = await performSignUp(data);
    if ("error" in res) {
      throw new Error(res.error);
    }
    return res;
  });

export const signInShopFn = createServerFn({ method: "POST" })
  .inputValidator(SignInSchema)
  .handler(async ({ data }) => {
    const res = await performSignIn(data);
    if ("error" in res) {
      throw new Error(res.error);
    }
    return res;
  });
