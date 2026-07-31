import fs from "fs";
import path from "path";
import postgres from "postgres";

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
  console.error("Error: DATABASE_URL is not set");
  process.exit(1);
}

const parsedDbUrl = dbUrl.includes("Mq@Hub#Dev2026!")
  ? dbUrl.replace("Mq@Hub#Dev2026!", "Mq%40Hub%23Dev2026%21")
  : dbUrl;

async function run() {
  console.log("Connecting to PostgreSQL to apply moderation seeds...");
  const isLocal = parsedDbUrl.includes("localhost") || parsedDbUrl.includes("127.0.0.1") || parsedDbUrl.includes("::1");
  const sql = postgres(parsedDbUrl, { 
    max: 1,
    ssl: isLocal ? false : "require"
  });

  try {
    const seedPath = path.resolve(process.cwd(), "db/seed_moderation_data.sql");
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, "utf-8");
      console.log("Executing seed_moderation_data.sql...");
      await sql.unsafe(content);
      console.log("Successfully seeded moderation data!");
    } else {
      console.error("seed_moderation_data.sql not found!");
    }
  } catch (error) {
    console.error("Failed executing seeds:", error);
  } finally {
    await sql.end();
  }
}

run();
