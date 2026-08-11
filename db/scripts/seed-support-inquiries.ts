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

async function seedInquiries() {
  console.log("Seeding rich support & contact inquiries...");

  // Seed sample contact submissions
  await sql`
    INSERT INTO contact_submissions (name, email, message, status, assigned_staff, admin_notes)
    VALUES 
    (
      'Samuel Mwangi',
      'samuel.mwangi@gmail.com',
      'Subject: Maize Blight Assistance\nUser Type: Farmer\nPhone: +254712345678\n\nMessage:\nHello Mqulima Team, my 5-acre maize field in Nakuru has developed yellow spot patterns on lower leaves. Need urgent agronomist visit.',
      'open',
      'Dr. Kiprono (Lead Agronomist)',
      'Assigned field agronomist for onsite leaf sample inspection.'
    ),
    (
      'Grace Cherono',
      'g.cherono@agrivet.co.ke',
      'Subject: Bulk Fertilizer Supply Partnership\nUser Type: Agribusiness\nPhone: +254722998877\n\nMessage:\nWe would like to list our certified DAP & CAN fertilizers on the Mqulima Agroshop platform for Uasin Gishu farmers.',
      'in_progress',
      'Jane Wanjiku (Market Specialist)',
      'Awaiting merchant license verification documents.'
    ),
    (
      'Peter Omondi',
      'omondi.peter@outlook.com',
      'Subject: USSD Market Price Advisory\nUser Type: Farmer\nPhone: +254733445566\n\nMessage:\nIs there a shortcode to check avocado prices in Eldoret wholesale market via SMS?',
      'resolved',
      'Peter Omondi (Logistics Lead)',
      'Provided *384*99# USSD menu instructions via SMS.'
    )
    ON CONFLICT DO NOTHING;
  `;

  // Seed sample partnership applications
  const details1 = {
    contact_name: "Dr. Evelyn Ruto",
    role: "Director of Extension Services",
    phone: "+254701234567",
    org_type: "NGO / Development Agency",
    tier_interest: "Regional Commercial Partner",
    countries: ["Kenya", "Uganda"],
    goal: "Collaborate on digital extension training for 10,000 smallholder dairy farmers in North Rift.",
    referral_source: "Agricultural Trade Fair 2026"
  };

  await sql`
    INSERT INTO partnership_applications (org_name, contact_email, details, status, assigned_staff, admin_notes)
    VALUES (
      'USAID Feed the Future Initiative',
      'evelyn.ruto@ftf-kenya.org',
      ${sql.json(details1)},
      'open',
      'Unassigned',
      NULL
    )
    ON CONFLICT DO NOTHING;
  `;

  console.log("Successfully seeded support inquiries!");
  process.exit(0);
}

seedInquiries();
