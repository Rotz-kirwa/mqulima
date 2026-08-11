import * as jose from "jose";
import { getDb } from "../db.server";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Extract and verify an authenticated admin user session from a Request.
 * Supports HTTP-Only 'mq_session' cookie AND 'Authorization: Bearer <token>' header.
 */
export async function getAuthAdminUserFromRequest(request: Request): Promise<AdminUser | null> {
  let token: string | null = null;

  // 1. Try Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }

  // 2. Try Cookie if no Bearer token
  if (!token) {
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const parts = c.trim().split("=");
        return [parts[0], parts.slice(1).join("=")];
      })
    );
    token = cookies["mq_session"] || null;
  }

  if (!token) {
    return null;
  }

  try {
    const secret = getJwtSecret();
    const { payload } = await jose.jwtVerify(token, secret);
    const userId = (payload.sub || payload.id) as string;

    if (!userId) {
      return null;
    }

    const sql = getDb();
    const [dbUser] = await sql`
      SELECT id, email, full_name, role
      FROM profiles
      WHERE id = ${userId}
        AND role IN ('admin', 'super_admin', 'operations_manager')
        AND deleted_at IS NULL
    `;

    if (!dbUser) {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.full_name,
      role: dbUser.role,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Enforce admin RBAC on an API route Request.
 * Returns either an error Response (if unauthorized) or the authenticated AdminUser.
 */
export async function requireAdminAuth(request: Request): Promise<{ user: AdminUser } | { response: Response }> {
  const user = await getAuthAdminUserFromRequest(request);
  if (!user) {
    return {
      response: new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized administrative access. Valid administrator authentication token or session required.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  return { user };
}
