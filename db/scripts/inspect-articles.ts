import postgres from "postgres";
import fs from "fs";

function loadEnv() {
  if (fs.existsSync(".env")) {
    const lines = fs.readFileSync(".env", "utf8").split("\n");
    for (const l of lines) {
      const trimmed = l.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...valParts] = trimmed.split("=");
      if (key && valParts.length > 0) {
        process.env[key] = valParts.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  }
}
loadEnv();

const dbUrl = process.env.DATABASE_URL!;
const parsedDbUrl = dbUrl.includes("Mq@Hub#Dev2026!")
  ? dbUrl.replace("Mq@Hub#Dev2026!", "Mq%40Hub%23Dev2026%21")
  : dbUrl;

const sql = postgres(parsedDbUrl, { max: 1 });

async function inspect() {
  const agritech = await sql`SELECT id, title, category, content FROM agritech_news`;
  console.log("=== AGRITECH NEWS ===", agritech);

  const blog = await sql`SELECT id, title, category, body FROM blog_posts`;
  console.log("=== BLOG POSTS ===", blog);

  process.exit(0);
}

inspect();
