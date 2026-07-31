import fs from "fs";
import path from "path";
import postgres from "postgres";

const prodDbUrl = process.env.DATABASE_URL || "postgresql://mqulima_db_user:NqL9Sdlti39Oa5aILYm944MjvJV9cEB4@dpg-d95kng28qa3s73e4sue0-a.ohio-postgres.render.com/mqulima_db";

console.log("Connecting to production Render database...");
const sql = postgres(prodDbUrl, { ssl: { rejectUnauthorized: false } });

async function seedProduction() {
  try {
    const seedsPath = path.resolve("./db/seeds.sql");
    const seedsSql = fs.readFileSync(seedsPath, "utf-8");

    console.log("Executing seeds.sql on production database...");
    await sql.unsafe(seedsSql);
    console.log("✅ Production database successfully seeded with all localhost demo products, profiles, categories, and orders!");
  } catch (err) {
    console.error("❌ Failed to seed production database:", err);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

seedProduction();
