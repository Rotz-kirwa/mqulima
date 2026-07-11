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
  console.log("Connecting to PostgreSQL to apply seeds...");
  
  // Render DBs require SSL, handle dynamically
  const isLocal = parsedDbUrl.includes("localhost") || parsedDbUrl.includes("127.0.0.1") || parsedDbUrl.includes("::1");
  const sql = postgres(parsedDbUrl, { 
    max: 1,
    ssl: isLocal ? false : "require"
  });

  try {
    console.log("Reading db/seeds.sql...");
    const seedsPath = path.resolve(process.cwd(), "db/seeds.sql");
    if (fs.existsSync(seedsPath)) {
      const content = fs.readFileSync(seedsPath, "utf-8");
      console.log("Applying seeds.sql (this may take a few seconds)...");
      await sql.unsafe(content);
      console.log("Successfully applied seeds.sql!");
    } else {
      console.warn("seeds.sql not found at path:", seedsPath);
    }

    console.log("Reading db/seeds_courses.sql...");
    const coursesPath = path.resolve(process.cwd(), "db/seeds_courses.sql");
    if (fs.existsSync(coursesPath)) {
      const content = fs.readFileSync(coursesPath, "utf-8");
      console.log("Applying seeds_courses.sql...");
      await sql.unsafe(content);
      console.log("Successfully applied seeds_courses.sql!");
    } else {
      console.warn("seeds_courses.sql not found at path:", coursesPath);
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
