import postgres from "postgres";
import fs from "fs";
import path from "path";

async function main() {
  const dbUrl = process.env.DATABASE_URL || "postgresql://mqulima_db_user:NqL9Sdlti39Oa5aILYm944MjvJV9cEB4@dpg-d95kng28qa3s73e4sue0-a.ohio-postgres.render.com/mqulima_db?sslmode=require";
  console.log("Connecting to Database...");
  const sql = postgres(dbUrl, { ssl: { rejectUnauthorized: false }, max: 1, idle_timeout: 5 });

  try {
    const migrationPath = path.join(process.cwd(), "db/migrations/00052_smooth_sale_pos_integration.sql");
    const migrationSql = fs.readFileSync(migrationPath, "utf-8");
    console.log("Applying Migration 00052...");
    await sql.unsafe(migrationSql);
    console.log("✅ Migration 00052 applied successfully!");

    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`
      INSERT INTO schema_migrations (version) 
      VALUES ('00052_smooth_sale_pos_integration.sql')
      ON CONFLICT (version) DO NOTHING;
    `;
    console.log("✅ Recorded in schema_migrations table!");
  } catch (err) {
    console.error("❌ Migration error:", err);
  } finally {
    await sql.end({ timeout: 2 });
    process.exit(0);
  }
}

main();
