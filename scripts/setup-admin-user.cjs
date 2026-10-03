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

async function setupAdmin() {
  const email = "mqulima@mqulima.com";
  const rawPassword = "mqulima$";
  const adminId = "00000000-0000-4000-a000-000000000001";
  
  console.log("=== CREATING / UPDATING ADMIN USER ===");
  console.log("Target Email:", email);
  console.log("Target Role: super_admin (full privilege over entire site & main site)");

  const passwordHash = await bcrypt.hash(rawPassword, 10);
  const verifyHash = await bcrypt.compare(rawPassword, passwordHash);
  if (!verifyHash) {
    throw new Error("Password verification failed during test");
  }
  console.log("Bcrypt hash generated and verified successfully.");

  await sql.begin(async (tx) => {
    // 1. Insert or update users table
    const [existingUser] = await tx`SELECT id, email FROM users WHERE LOWER(email) = ${email.toLowerCase()}`;
    const userCountBefore = (await tx`SELECT count(*)::int as c FROM users`)[0].c;

    if (existingUser) {
      console.log("Updating existing user record in users table...");
      await tx`
        UPDATE users
        SET password_hash = ${passwordHash},
            first_name = 'Mqulima',
            last_name = 'Admin',
            is_verified = true,
            status = 'active'
        WHERE id = ${existingUser.id}
      `;
    } else {
      console.log("Inserting new user record into users table...");
      await tx`
        INSERT INTO users (
          id, email, password_hash, first_name, last_name, 
          phone_number, national_id, county, delivery_location, 
          farming_type, status, is_verified, created_at
        ) VALUES (
          ${adminId}, ${email.toLowerCase()}, ${passwordHash}, 'Mqulima', 'Admin',
          '+254700000000', '00000000', 'Nairobi', 'Mqulima HQ, Nairobi',
          'Executive Administrator', 'active', true, NOW()
        )
      `;
    }

    const userCountAfter = (await tx`SELECT count(*)::int as c FROM users`)[0].c;
    console.log(`users table rows: before=${userCountBefore}, after=${userCountAfter}`);

    // 2. Insert or update profiles table
    const [existingProfile] = await tx`SELECT id, email, role FROM profiles WHERE LOWER(email) = ${email.toLowerCase()}`;
    const profileCountBefore = (await tx`SELECT count(*)::int as c FROM profiles`)[0].c;

    if (existingProfile) {
      console.log("Updating existing profile record in profiles table...");
      await tx`
        UPDATE profiles
        SET role = 'super_admin',
            password_hash = ${passwordHash},
            full_name = 'Mqulima Administrator',
            username = 'mqulima_admin',
            phone = '+254700000000',
            country = 'Kenya',
            restriction_status = 'active',
            status = 'active',
            is_verified = true,
            reputation_score = 100,
            county_region = 'Nairobi',
            updated_at = NOW()
        WHERE id = ${existingProfile.id}
      `;
    } else {
      console.log("Inserting new profile record into profiles table...");
      await tx`
        INSERT INTO profiles (
          id, email, password_hash, full_name, username,
          phone, role, country, restriction_status, status, 
          is_verified, reputation_score, county_region, created_at, updated_at
        ) VALUES (
          ${adminId}, ${email.toLowerCase()}, ${passwordHash}, 'Mqulima Administrator', 'mqulima_admin',
          '+254700000000', 'super_admin', 'Kenya', 'active', 'active',
          true, 100, 'Nairobi', NOW(), NOW()
        )
      `;
    }

    const profileCountAfter = (await tx`SELECT count(*)::int as c FROM profiles`)[0].c;
    console.log(`profiles table rows: before=${profileCountBefore}, after=${profileCountAfter}`);
  });

  // Verify created credentials by simulating both login queries
  console.log("\n=== VERIFYING LOGIN IN DATABASE ===");
  const [adminLookup] = await sql`
    SELECT id, email, password_hash, full_name, role
    FROM profiles
    WHERE LOWER(email) = ${email.toLowerCase()}
      AND role::text IN ('admin', 'super_admin', 'sales_agent', 'content_editor')
      AND deleted_at IS NULL
  `;

  if (!adminLookup) {
    throw new Error("Admin lookup in profiles table failed!");
  }
  const match = await bcrypt.compare(rawPassword, adminLookup.password_hash);
  if (!match) {
    throw new Error("Bcrypt password verification in database failed!");
  }

  console.log("Admin account verified in database:");
  console.log({
    id: adminLookup.id,
    email: adminLookup.email,
    name: adminLookup.full_name,
    role: adminLookup.role,
    passwordMatches: match
  });

  await sql.end();
}

setupAdmin().catch(err => {
  console.error("Failed to setup admin:", err);
  process.exit(1);
});
