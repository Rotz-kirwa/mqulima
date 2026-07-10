import fs from "fs";
import path from "path";
import postgres from "postgres";

// Load .env file manually only if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const parts = line.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
        process.env[key] = val;
      }
    }
  }
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Error: DATABASE_URL is not set in environment or .env file");
  process.exit(1);
}

// Encode special characters in connection string password programmatically
const parsedDbUrl = dbUrl.includes("Mq@Hub#Dev2026!")
  ? dbUrl.replace("Mq@Hub#Dev2026!", "Mq%40Hub%23Dev2026%21")
  : dbUrl;

async function run() {
  console.log("Connecting to PostgreSQL...");
  const sql = postgres(parsedDbUrl, { max: 1 });

  try {
    // Ensure migrations tracking table exists
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Check if profiles table exists to see if the database is already initialized
    const [profilesExists] = await sql`
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'profiles'
    `;

    const migrationsDir = path.resolve(process.cwd(), "db/migrations");
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    if (profilesExists) {
      console.log("Database already initialized. Seeding schema_migrations with existing files...");
      for (const file of files) {
        if (file < "00017_create_users_table.sql") {
          await sql`
            INSERT INTO schema_migrations (version) 
            VALUES (${file})
            ON CONFLICT (version) DO NOTHING
          `;
        }
      }
    }

    console.log(`Found ${files.length} migration files.`);

    for (const file of files) {
      const [alreadyApplied] = await sql`
        SELECT 1 FROM schema_migrations WHERE version = ${file}
      `;

      if (alreadyApplied) {
        console.log(`Migration ${file} is already applied.`);
        continue;
      }

      console.log(`Applying migration ${file}...`);
      const content = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      
      // Execute the migration content
      await sql.unsafe(content);

      await sql`
        INSERT INTO schema_migrations (version) VALUES (${file})
      `;
      console.log(`Successfully applied ${file}.`);
    }

    console.log("All migrations applied successfully!");
  } catch (error) {
    console.error("Migrations failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
