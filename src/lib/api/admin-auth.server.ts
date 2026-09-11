import * as jose from "jose";
import { getDb } from "../db.server";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

import { getServerConfig } from "../config.server";

function getJwtSecret(): Uint8Array {
  const env = getServerConfig();
  return new TextEncoder().encode(env.JWT_SECRET);
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
        AND role::text IN ('admin', 'super_admin', 'sales_agent', 'content_editor')
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

export type AdminPermission =
  | "customers.read"
  | "customers.update"
  | "customers.delete"
  | "products.read"
  | "products.create"
  | "products.update"
  | "products.archive"
  | "orders.read"
  | "orders.update"
  | "payments.read"
  | "payments.reconcile"
  | "content.read"
  | "content.create"
  | "content.update"
  | "content.delete"
  | "inquiries.read"
  | "inquiries.update";

export const ROLE_PERMISSIONS: Record<string, AdminPermission[]> = {
  super_admin: [
    "customers.read", "customers.update", "customers.delete",
    "products.read", "products.create", "products.update", "products.archive",
    "orders.read", "orders.update",
    "payments.read", "payments.reconcile",
    "content.read", "content.create", "content.update", "content.delete",
    "inquiries.read", "inquiries.update",
  ],
  admin: [
    "customers.read", "customers.update", "customers.delete",
    "products.read", "products.create", "products.update", "products.archive",
    "orders.read", "orders.update",
    "payments.read", "payments.reconcile",
    "content.read", "content.create", "content.update", "content.delete",
    "inquiries.read", "inquiries.update",
  ],
  sales_agent: [
    "customers.read",
    "products.read",
    "orders.read", "orders.update",
    "payments.read",
    "inquiries.read", "inquiries.update",
  ],
  content_editor: [
    "content.read", "content.create", "content.update", "content.delete",
    "products.read",
    "customers.read",
    "inquiries.read",
  ],
};

export type AdminUserContext = {
  id?: string;
  email?: string;
  role: string;
};

export function hasPermission(
  roleOrUser: string | AdminUserContext | AdminUser,
  permission: AdminPermission
): boolean {
  const role = typeof roleOrUser === "string" ? roleOrUser : roleOrUser?.role;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function assertAdminPermission(
  roleOrUser: string | AdminUserContext | AdminUser,
  permission: AdminPermission
): void {
  if (!hasPermission(roleOrUser, permission)) {
    const role = typeof roleOrUser === "string" ? roleOrUser : roleOrUser?.role;
    throw new Error(`Forbidden: role '${role}' lacks required permission '${permission}'.`);
  }
}

/**
 * Enforce granular admin RBAC on an API route Request.
 * Returns either an error Response (401 or 403) or the authenticated AdminUser.
 */
export async function requireAdminPermission(
  request: Request,
  permission: AdminPermission
): Promise<{ user: AdminUser } | { response: Response }> {
  const auth = await requireAdminAuth(request);
  if ("response" in auth) return auth;

  if (!hasPermission(auth.user.role, permission)) {
    return {
      response: new Response(
        JSON.stringify({
          success: false,
          error: `Forbidden: role '${auth.user.role}' lacks required permission '${permission}'.`,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  return auth;
}

/**
 * Enforce admin authentication, and optionally a required permission.
 */
export async function requireAdminAuth(
  request: Request,
  requiredPermission?: AdminPermission
): Promise<{ user: AdminUser } | { response: Response }> {
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

  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return {
      response: new Response(
        JSON.stringify({
          success: false,
          error: `Forbidden: role '${user.role}' lacks required permission '${requiredPermission}'.`,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  return { user };
}
