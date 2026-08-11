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

async function inspectTables() {
  // Ensure contact_submissions schema
  await sql`
    ALTER TABLE contact_submissions 
    ADD COLUMN IF NOT EXISTS status varchar(50) DEFAULT 'open',
    ADD COLUMN IF NOT EXISTS assigned_staff varchar(100) DEFAULT 'Unassigned',
    ADD COLUMN IF NOT EXISTS admin_notes text;
  `;

  await sql`
    ALTER TABLE partnership_applications 
    ADD COLUMN IF NOT EXISTS status varchar(50) DEFAULT 'open',
    ADD COLUMN IF NOT EXISTS assigned_staff varchar(100) DEFAULT 'Unassigned',
    ADD COLUMN IF NOT EXISTS admin_notes text;
  `;

  const contactCount = await sql`SELECT count(*) FROM contact_submissions`;
  const partnershipCount = await sql`SELECT count(*) FROM partnership_applications`;
  const serviceCount = await sql`SELECT count(*) FROM service_requests`;

  console.log("Contact Submissions:", contactCount[0].count);
  console.log("Partnership Applications:", partnershipCount[0].count);
  console.log("Service Requests:", serviceCount[0].count);

  process.exit(0);
}

inspectTables();
