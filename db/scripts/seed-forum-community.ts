import postgres from "postgres";
import fs from "fs";
import path from "path";

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  for (const line of envConfig.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valParts] = trimmed.split("=");
      if (key && valParts.length > 0) {
        const val = valParts.join("=").trim().replace(/^["']|["']$/g, "");
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
  console.log("Connecting to PostgreSQL for forum community seeding...");
  const sql = postgres(parsedDbUrl, { max: 1 });

  try {
    // 1. Ensure sample farmer profiles exist
    const sampleFarmers = [
      {
        username: "mqulima_grace",
        email: "grace@mqulima.co.ke",
        full_name: "Grace Cherono",
        county_region: "Uasin Gishu",
        country: "Kenya",
        farming_interests: ["Maize", "Horticulture", "Soil Health"],
        crops: ["Maize", "Cabbage"],
        years_farming: 8,
        certifications: ["GlobalGAP Certified"],
        reputation_score: 480,
        avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
        bio: "Passionate horticulturist from Eldoret. Sharing daily farming tips and sustainable agriculture solutions."
      },
      {
        username: "mqulima_joseph",
        email: "joseph@mqulima.co.ke",
        full_name: "Joseph Omondi",
        county_region: "Kisumu",
        country: "Kenya",
        farming_interests: ["Aquaculture", "Poultry"],
        livestock: ["Tilapia", "Poultry"],
        years_farming: 5,
        certifications: ["Certified Fish Farmer"],
        reputation_score: 310,
        avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
        bio: "Fish farmer and poultry enthusiast based near Lake Victoria. Innovating with recirculating aquaculture setups."
      },
      {
        username: "mqulima_beatrice",
        email: "beatrice@mqulima.co.ke",
        full_name: "Beatrice Wambui",
        county_region: "Kiambu",
        country: "Kenya",
        farming_interests: ["Drip Irrigation", "Strawberry", "Greenhouse"],
        crops: ["Strawberry", "Tomato"],
        years_farming: 12,
        certifications: ["Organic Kenya"],
        reputation_score: 650,
        avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300",
        bio: "Kiambu-based berry grower specializing in organic farming & modern drip irrigation setups."
      },
      {
        username: "mqulima_dr_mutua",
        email: "mutua@mqulima.co.ke",
        full_name: "Dr. David Mutua",
        county_region: "Machakos",
        country: "Kenya",
        farming_interests: ["Agronomy", "Crop Pathology", "Drought Resilient Farming"],
        crops: ["Sorghum", "Cowpeas"],
        years_farming: 15,
        certifications: ["Senior Agronomist", "PhD Crop Science"],
        reputation_score: 920,
        avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300",
        bio: "Lead Agronomist offering practical solutions for semi-arid farming and soil restoration across Machakos & Makueni."
      }
    ];

    const profileMap = new Map<string, string>();

    for (const f of sampleFarmers) {
      const [existing] = await sql`SELECT id FROM profiles WHERE username = ${f.username}`;
      if (existing) {
        profileMap.set(f.username, existing.id);
      } else {
        const [inserted] = await sql`
          INSERT INTO profiles (
            username, email, password_hash, full_name, county_region, country, farming_interests, crops, livestock,
            years_farming, certifications, reputation_score, avatar_url, bio, role
          ) VALUES (
            ${f.username}, ${f.email}, '$2b$10$E9s8JvK/8zW3xQ/7Yw7G1.YxW0V1U2T3S4R5Q6P7O8N9M8L7K6J5', ${f.full_name}, ${f.county_region}, ${f.country}, ${f.farming_interests},
            ${f.crops || []}, ${f.livestock || []}, ${f.years_farming}, ${f.certifications},
            ${f.reputation_score}, ${f.avatar_url}, ${f.bio}, 'farmer'
          ) RETURNING id
        `;
        profileMap.set(f.username, inserted.id);
      }
    }

    console.log(`Verified ${profileMap.size} farmer profiles.`);

    // 2. Ensure initial community posts exist
    console.log("Seeding/verifying community posts...");

    const graceId = profileMap.get("mqulima_grace");
    const josephId = profileMap.get("mqulima_joseph");
    const beatriceId = profileMap.get("mqulima_beatrice");
    const mutuaId = profileMap.get("mqulima_dr_mutua");

    const postsToInsert = [
      {
        user_id: graceId,
        type: "moment",
        title: "How to combat Fall Armyworm organically",
        caption: "This season, I've successfully managed to protect my 2-acre maize crop from Fall Armyworm without using harsh chemicals. I used a neem leaf extract solution (soaked overnight and diluted) sprayed early morning when the larvae are active. It works wonders! Check out the leaves, absolutely green.",
        media_urls: ["https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=1200"],
        like_count: 48,
        relate_count: 14,
        comment_count: 2,
        tags: ["#Maize", "#OrganicPesticide", "#FallArmyworm", "#NeemExtract"],
        status: "published"
      },
      {
        user_id: mutuaId,
        type: "story",
        title: "Soil pH Testing: The Single Most Important Step Before Planting",
        caption: "Many farmers invest in expensive fertilizers only to get low yields because their soil acidity binds essential nutrients. Test your soil pH early! A pH below 5.5 locks up phosphorus. Adding agricultural lime 4 weeks before sowing can boost your crop fertilizer absorption by up to 60%.",
        media_urls: ["https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=1200"],
        like_count: 92,
        relate_count: 36,
        comment_count: 3,
        tags: ["#SoilHealth", "#AgronomyTips", "#LimeApplication", "#YieldOptimization"],
        status: "published"
      },
      {
        user_id: josephId,
        type: "harvest",
        title: "Bumper harvest from our tilapia fish ponds in Kisumu!",
        caption: "Harvested over 500kg of table-size tilapia from our experimental pond 2 today. The use of high-quality floating feeds combined with consistent solar-powered water aeration made a massive difference. Looking to expand to two more ponds by next month.",
        media_urls: ["https://images.unsplash.com/photo-1534349735944-2b3a6f7a268f?auto=format&fit=crop&q=80&w=1200"],
        like_count: 64,
        relate_count: 18,
        comment_count: 1,
        tags: ["#Aquaculture", "#Tilapia", "#KisumuFarming", "#FishPonds"],
        status: "published"
      },
      {
        user_id: beatriceId,
        type: "moment",
        title: "Transitioning to drip irrigation: Is it worth the capital?",
        caption: "Many fellow farmers in Kiambu ask if installing drip kits is worth the initial capital. After 1 year of using drip lines on our strawberry crop, water usage is down 45%, weeding labor decreased significantly, and berry yield increased by 30%. It paid for itself in under 9 months!",
        media_urls: ["https://images.unsplash.com/photo-1463121859909-073c988e4367?auto=format&fit=crop&q=80&w=1200"],
        like_count: 85,
        relate_count: 29,
        comment_count: 2,
        tags: ["#DripIrrigation", "#StrawberryFarming", "#WaterConservation", "#Kiambu"],
        status: "published"
      }
    ];

    for (const p of postsToInsert) {
      if (!p.user_id) continue;
      const [existingPost] = await sql`SELECT id FROM show_posts WHERE title = ${p.title}`;
      if (existingPost) continue;

      const [insertedPost] = await sql`
        INSERT INTO show_posts (user_id, type, title, caption, media_urls, like_count, relate_count, comment_count, tags, status)
        VALUES (${p.user_id}, ${p.type}, ${p.title}, ${p.caption}, ${p.media_urls}, ${p.like_count}, ${p.relate_count}, ${p.comment_count}, ${p.tags}, ${p.status})
        RETURNING id
      `;

      if (p.title.includes("Fall Armyworm") && mutuaId) {
        const [c1] = await sql`
          INSERT INTO show_comments (post_id, user_id, body)
          VALUES (${insertedPost.id}, ${mutuaId}, 'Excellent organic control method Grace! For severe infestations, combining Neem with Bacillus thuringiensis (Bt) gives an even higher mortality rate on young instar larvae.')
          RETURNING id
        `;
        await sql`
          INSERT INTO show_comments (post_id, user_id, body, parent_id)
          VALUES (${insertedPost.id}, ${p.user_id}, 'Thank you Dr. Mutua! I will add Bt to my spray schedule next week.', ${c1.id})
        `;
      } else if (p.title.includes("Soil pH") && graceId) {
        await sql`
          INSERT INTO show_comments (post_id, user_id, body)
          VALUES (${insertedPost.id}, ${graceId}, 'Where can farmers get fast soil testing kits in Eldoret?')
        `;
      }
    }
    console.log("Seeded community posts & comment threads successfully.");

    // 3. Ensure pulse posts exist
    const existingPulse = await sql`SELECT COUNT(*)::int as count FROM pulse_posts`;
    if (existingPulse[0].count === 0) {
      console.log("Seeding pulse agronomy alerts...");
      const mutuaId = profileMap.get("mqulima_dr_mutua");
      await sql`
        INSERT INTO pulse_posts (author_id, title, body, category, source_url)
        VALUES
        (${mutuaId}, 'NCPB Adjusts Dry Maize Buying Price to KES 3,600 per 90kg Bag', 'The National Cereals and Produce Board has officially announced updated grain purchase prices across Western and North Rift depots to protect farmers from middleman exploitation.', 'Market Trend', 'https://ncpb.co.ke'),
        (${mutuaId}, 'High Humidity Weather Alert: Blight Risk for Solanaceous Crops in Central Region', 'Meteorological data indicates prolonged humidity levels above 85% across Kiambu, Murang''a, and Nyeri. Potato and tomato farmers are advised to apply preventative fungicide spray windows.', 'Weather Alert', 'https://meteo.go.ke'),
        (${mutuaId}, 'Government Rollout of Subsidized NPK 17:17:17 Fertilizer', 'Registered farmers under the Kenya Integrated Agriculture Management Information System (KIAMIS) can now access e-vouchers at county agro-dealers for the upcoming planting season.', 'Policy Update', 'https://kilimo.go.ke')
      `;
    }

    console.log("Forum community database seeding complete!");
  } catch (err) {
    console.error("Error seeding forum community data:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
