import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "../db.server";
import { authenticateRequest, signUserToken } from "./auth-helper";
import { performSignUp } from "../api/auth-shop.server";
import { getClientIp, checkLoginRateLimit, checkSignupRateLimit } from "../rate-limit.server";

const LoginSchema = z.object({
  identifier: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
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
  try {
    const ip = getClientIp();
    await checkSignupRateLimit(ip).catch(() => {});

    const body = await request.json().catch(() => ({}));
    const parseResult = RegisterSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: "Validation failed", details: parseResult.error.flatten().fieldErrors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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
      farmSizeAcres,
      password,
    } = parseResult.data;

    // Use dual-table insertion logic with welcome SMS dispatch
    const res = await performSignUp({
      firstName,
      lastName,
      email,
      phoneNumber,
      nationalId: nationalId || "N/A",
      county,
      deliveryLocation,
      farmingType,
      specifyFarmingType,
      farmSizeAcres,
      password,
      acceptTerms: true,
    });

    if ("error" in res) {
      return new Response(
        JSON.stringify({ success: false, error: res.error, field: res.field }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = res.userId!;
    const token = await signUserToken(userId, email, "farmer");
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    return new Response(
      JSON.stringify({
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
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[API/V1/REGISTER ERROR]:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Registration failed. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleAuthLogin(request: Request): Promise<Response> {
  try {
    const ip = getClientIp();
    await checkLoginRateLimit(ip).catch(() => {});

    const body = await request.json().catch(() => ({}));
    const parseResult = LoginSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: "Validation failed", details: parseResult.error.flatten().fieldErrors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email/phone number or password." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const isMatch = await bcrypt.compare(password, dbUser.password_hash);
    if (!isMatch) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email/phone number or password." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update last_login_at in background
    await sql`UPDATE profiles SET last_login_at = NOW() WHERE id = ${dbUser.id}`.catch(() => {});

    const token = await signUserToken(dbUser.id, dbUser.email, dbUser.role || "farmer");

    return new Response(
      JSON.stringify({
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
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[API/V1/LOGIN ERROR]:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Login failed. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleAuthMe(request: Request): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized. Please sign in to continue." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      user,
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      county: user.county || "Kenya",
      role: user.role,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export async function handleUpdateProfile(request: Request): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
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

    return new Response(
      JSON.stringify({
        success: true,
        message: "Profile updated successfully.",
        user: { ...user, name: fullName, county, phone, avatarUrl },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to update profile." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
