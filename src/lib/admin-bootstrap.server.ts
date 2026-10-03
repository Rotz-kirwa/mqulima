import { getDb } from "./db.server";
import bcrypt from "bcryptjs";

export async function ensureSuperAdminUser() {
  try {
    const sql = getDb();
    const adminId = "00000000-0000-4000-a000-000000000001";
    const email = "mqulima@mqulima.com";
    const rawPassword = "mqulima$";

    const [existing] = await sql`
      SELECT id, email, role FROM profiles WHERE LOWER(email) = ${email} AND deleted_at IS NULL
    `;

    const passwordHash = await bcrypt.hash(rawPassword, 10);

    if (!existing) {
      console.log("[ADMIN BOOTSTRAP] Provisioning default super admin (mqulima@mqulima.com)...");
      await sql`
        INSERT INTO profiles (
          id, email, password_hash, full_name, username,
          phone, role, country, restriction_status, status, 
          is_verified, reputation_score, county_region, created_at, updated_at
        ) VALUES (
          ${adminId}, ${email}, ${passwordHash}, 'Mqulima Administrator', 'mqulima_admin',
          '+254700000000', 'super_admin', 'Kenya', 'active', 'active',
          true, 100, 'Nairobi', NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          email = ${email},
          password_hash = ${passwordHash},
          role = 'super_admin',
          status = 'active',
          deleted_at = NULL,
          updated_at = NOW()
      `;

      await sql`
        INSERT INTO users (
          id, email, password_hash, first_name, last_name, 
          phone_number, national_id, county, delivery_location, 
          farming_type, status, is_verified, created_at
        ) VALUES (
          ${adminId}, ${email}, ${passwordHash}, 'Mqulima', 'Admin',
          '+254700000000', '00000000', 'Nairobi', 'Mqulima HQ, Nairobi',
          'Executive Administrator', 'active', true, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          email = ${email},
          password_hash = ${passwordHash},
          status = 'active',
          deleted_at = NULL,
          updated_at = NOW()
      `.catch(() => {});
      console.log("[ADMIN BOOTSTRAP] Default super admin successfully provisioned!");
    }
  } catch (err) {
    console.error("[ADMIN BOOTSTRAP] Error ensuring super admin:", err);
  }
}
