import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/lib/db.server";
import bcrypt from "bcryptjs";
import * as jose from "jose";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

export const Route = createFileRoute("/api/admin/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { identifier, password } = body || {};

          if (!identifier || !password) {
            return new Response(
              JSON.stringify({ success: false, error: "Username/Email and Password are required" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const sql = getDb();
          const cleanIdent = identifier.trim().toLowerCase();

          // Search database for admin user in profiles table
          const [dbAdmin] = await sql`
            SELECT id, email, password_hash, full_name, role
            FROM profiles
            WHERE (LOWER(email) = ${cleanIdent} OR phone = ${cleanIdent})
              AND role IN ('admin', 'super_admin', 'operations_manager')
              AND deleted_at IS NULL
          `;

          if (dbAdmin && dbAdmin.password_hash) {
            const match = await bcrypt.compare(password, dbAdmin.password_hash);
            if (match) {
              // Sign JWT token for admin session
              const secret = getJwtSecret();
              const token = await new jose.SignJWT({
                sub: dbAdmin.id,
                email: dbAdmin.email,
                role: dbAdmin.role,
              })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime("7d")
                .sign(secret);

              const userObj = {
                id: dbAdmin.id,
                name: dbAdmin.full_name || "Executive Admin",
                email: dbAdmin.email,
                role: (dbAdmin.role || "super_admin").toUpperCase().replace("_", " "),
              };

              const isProd = process.env.NODE_ENV === "production";
              const cookieHeader = `mq_session=${token}; Path=/; HttpOnly; ${isProd ? "Secure; " : ""}SameSite=Lax; Max-Age=604800`;

              return new Response(
                JSON.stringify({
                  success: true,
                  token,
                  user: userObj,
                }),
                {
                  status: 200,
                  headers: {
                    "Content-Type": "application/json",
                    "Set-Cookie": cookieHeader,
                  },
                }
              );
            }
          }

          return new Response(
            JSON.stringify({ success: false, error: "Invalid administrator credentials or insufficient privileges." }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        } catch (error: any) {
          console.error("Admin login API error:", error);
          return new Response(
            JSON.stringify({ success: false, error: error.message || "Authentication failed" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
