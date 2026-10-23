import * as jose from "jose";
import { getServerConfig } from "../config.server";
import { getDb } from "../db.server";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  county?: string;
  countyRegion?: string;
  farmSize?: string;
  crops?: string;
  livestock?: string;
  avatarUrl?: string;
}

function getJwtSecret(): Uint8Array {
  const env = getServerConfig();
  return new TextEncoder().encode(env.JWT_SECRET);
}

/**
 * Extracts Bearer token or mq_session cookie and verifies against JWT_SECRET.
 * Resolves the authenticated user from the PostgreSQL database (profiles + users).
 */
export async function authenticateRequest(request: Request): Promise<AuthenticatedUser | null> {
  let token: string | null = null;

  // 1. Check Authorization: Bearer <token> header (Native Android / Mobile Client)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }

  // 2. Fall back to Cookie: mq_session=<token> (Web Client)
  if (!token) {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)mq_session=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1].trim());
      }
    }
  }

  if (!token) return null;

  try {
    const secret = getJwtSecret();
    const { payload } = await jose.jwtVerify(token, secret);
    const userId = (payload.sub || (payload as any).id) as string;
    const tokenEmail = (typeof payload.email === "string" ? payload.email : "").trim().toLowerCase();

    if (!userId && !tokenEmail) return null;

    const sql = getDb();

    // Query profiles table
    let [dbProfile] = await sql`
      SELECT 
        p.id, p.email, p.full_name, p.phone, p.role, 
        p.county_region, p.years_farming, p.crops, p.livestock, p.avatar_url,
        u.first_name, u.last_name, u.county, u.phone_number
      FROM profiles p
      LEFT JOIN users u ON u.id = p.id
      WHERE (p.id = ${userId || "00000000-0000-0000-0000-000000000000"} OR LOWER(p.email) = ${tokenEmail})
        AND p.deleted_at IS NULL
      LIMIT 1
    `;

    if (!dbProfile) {
      // Check users table directly
      const [dbUser] = await sql`
        SELECT id, email, first_name, last_name, phone_number, county
        FROM users
        WHERE (id = ${userId || "00000000-0000-0000-0000-000000000000"} OR LOWER(email) = ${tokenEmail})
          AND deleted_at IS NULL
        LIMIT 1
      `;
      if (!dbUser) return null;

      return {
        id: dbUser.id,
        name: `${dbUser.first_name} ${dbUser.last_name}`.trim(),
        email: dbUser.email,
        phone: dbUser.phone_number,
        role: "farmer",
        county: dbUser.county || "Kenya",
      };
    }

    const fullName = dbProfile.full_name || `${dbProfile.first_name || ""} ${dbProfile.last_name || ""}`.trim() || "Mqulima Farmer";

    return {
      id: dbProfile.id,
      name: fullName,
      email: dbProfile.email,
      phone: dbProfile.phone || dbProfile.phone_number || "",
      role: dbProfile.role || "farmer",
      county: dbProfile.county_region || dbProfile.county || "Kenya",
      countyRegion: dbProfile.county_region || dbProfile.county || "Kenya",
      farmSize: `${dbProfile.years_farming || 0} years`,
      crops: dbProfile.crops ? (Array.isArray(dbProfile.crops) ? dbProfile.crops.join(", ") : String(dbProfile.crops)) : "",
      livestock: dbProfile.livestock ? (Array.isArray(dbProfile.livestock) ? dbProfile.livestock.join(", ") : String(dbProfile.livestock)) : "",
      avatarUrl: dbProfile.avatar_url || "",
    };
  } catch (err) {
    return null;
  }
}

/**
 * Signs a standard JWT for mobile or web clients with 30-day expiration.
 */
export async function signUserToken(userId: string, email: string, role = "farmer"): Promise<string> {
  const secret = getJwtSecret();
  return new jose.SignJWT({ sub: userId, role, email: email.trim().toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}
