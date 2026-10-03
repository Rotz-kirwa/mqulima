const fs = require("fs");
const postgres = require("postgres");
const bcrypt = require("bcryptjs");

function loadEnv() {
  if (fs.existsSync(".env")) {
    fs.readFileSync(".env", "utf8").split("\n").forEach(l => {
      const trimmed = l.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const [k, ...v] = trimmed.split("=");
      if (k && v.length) process.env[k] = v.join("=").trim().replace(/^["\x27]|["\x27]$/g, "");
    });
  }
}
loadEnv();

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });

async function addAliases() {
  const password = "mqulima$";
  const hash = await bcrypt.hash(password, 10);

  const accounts = [
    { email: "mqulima@mqulima.com", username: "mqulima_admin", phone: "+254700000000", nationalId: "00000000", id: "00000000-0000-4000-a000-000000000001" },
    { email: "mkulima@mqulima.com", username: "mqulima_mkulima", phone: "+254700000001", nationalId: "00000001", id: "00000000-0000-4000-a000-000000000002" },
    { email: "admin@mqulima.co.ke", username: "mqulima_operational", phone: "+254700000002", nationalId: "00000002", id: "00000000-0000-4000-a000-000000000003" }
  ];

  for (const acc of accounts) {
    const [existing] = await sql`SELECT id FROM profiles WHERE LOWER(email) = ${acc.email.toLowerCase()}`;
    if (!existing) {
      await sql`
        INSERT INTO users (
          id, email, password_hash, first_name, last_name,
          phone_number, national_id, county, delivery_location,
          farming_type, status, is_verified, created_at
        ) VALUES (
          ${acc.id}, ${acc.email.toLowerCase()}, ${hash}, 'Mqulima', 'Administrator',
          ${acc.phone}, ${acc.nationalId}, 'Nairobi', 'Mqulima HQ, Nairobi',
          'Executive Administrator', 'active', true, NOW()
        ) ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}, is_verified = true
      `;
      await sql`
        INSERT INTO profiles (
          id, email, password_hash, full_name, username,
          phone, role, country, restriction_status, status,
          is_verified, reputation_score, county_region, created_at, updated_at
        ) VALUES (
          ${acc.id}, ${acc.email.toLowerCase()}, ${hash}, 'Mqulima Administrator', ${acc.username},
          ${acc.phone}, 'super_admin', 'Kenya', 'active', 'active',
          true, 100, 'Nairobi', NOW(), NOW()
        ) ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}, role = 'super_admin', is_verified = true
      `;
      console.log("Created super_admin account for:", acc.email);
    } else {
      await sql`
        UPDATE users
        SET password_hash = ${hash}, is_verified = true, status = 'active'
        WHERE LOWER(email) = ${acc.email.toLowerCase()}
      `;
      await sql`
        UPDATE profiles
        SET password_hash = ${hash}, role = 'super_admin', is_verified = true, status = 'active', updated_at = NOW()
        WHERE LOWER(email) = ${acc.email.toLowerCase()}
      `;
      console.log("Updated super_admin account for:", acc.email);
    }
  }

  const allAdmins = await sql`SELECT email, role, username FROM profiles WHERE role::text IN ('admin', 'super_admin')`;
  console.log("\nActive Super Admins in DB:", allAdmins);
  await sql.end();
}

addAliases().catch(err => {
  console.error("Error setting up aliases:", err);
  process.exit(1);
});
