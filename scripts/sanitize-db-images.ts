import postgres from "postgres";
import fs from "fs";
import path from "path";

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

const sql = postgres(parsedDbUrl, { max: 1, ssl: { rejectUnauthorized: false } });

async function sanitize() {
  console.log("Starting DB image and title sanitization...");
  const outDir = path.resolve("public/images/news");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Process agritech_news
  const articles = await sql`SELECT id, title, slug, media_url, media_type FROM agritech_news`;
  console.log(`Found ${articles.length} articles in agritech_news.`);

  for (const art of articles) {
    let newMediaUrl = art.media_url;
    let newTitle = art.title;

    // Title cleanups
    if (art.title.includes("Elnino:")) {
      newTitle = "El Niño: Heavy Rains, Harvest Safeguards, and Agricultural Opportunities";
    } else if (art.title.includes("Role of goons")) {
      newTitle = "Why Kenya's Food Costs Keep Rising: Supply Chain Bottlenecks and Market Reforms";
    } else if (art.title.includes("The Way, The Truth and The Light:")) {
      newTitle = "Why Sheep Farming Is Kenya's Strategic Opportunity for Food Security and Farmer Incomes";
    }

    // Base64 image extraction
    if (art.media_url && art.media_url.startsWith("data:image/")) {
      const match = art.media_url.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        const ext = match[1] === "jpeg" ? "jpg" : match[1];
        const base64Data = match[2];
        const filename = `${art.slug || art.id}-cover.${ext}`;
        const filePath = path.join(outDir, filename);
        fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
        newMediaUrl = `/images/news/${filename}`;
        console.log(`Extracted base64 image for [${art.id}] -> ${newMediaUrl} (${fs.statSync(filePath).size} bytes)`);
      }
    } else if (art.media_url && art.media_url.includes("pinimg.com")) {
      // Fetch or replace pinimg image
      try {
        console.log(`Downloading pinimg image for [${art.id}]: ${art.media_url}`);
        const res = await fetch(art.media_url, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          const filename = `${art.slug || art.id}-cover.jpg`;
          const filePath = path.join(outDir, filename);
          fs.writeFileSync(filePath, buffer);
          newMediaUrl = `/images/news/${filename}`;
          console.log(`Saved self-hosted image for [${art.id}] -> ${newMediaUrl}`);
        } else {
          newMediaUrl = "/mqulima_news_banner.png";
        }
      } catch (err) {
        console.warn(`Failed to download pinimg for ${art.id}, using fallback:`, err);
        newMediaUrl = "/mqulima_news_banner.png";
      }
    }

    if (newMediaUrl !== art.media_url || newTitle !== art.title) {
      await sql`
        UPDATE agritech_news
        SET media_url = ${newMediaUrl}, title = ${newTitle}
        WHERE id = ${art.id}
      `;
      console.log(`Updated article [${art.id}] title and media_url`);
    }
  }

  // 2. Process products with pinimg URLs
  const products = await sql`SELECT id, name, image_urls FROM products WHERE array_to_string(image_urls, ',') LIKE '%pinimg%'`;
  console.log(`Found ${products.length} products with pinimg.`);

  const productFallbackMap: Record<string, string[]> = {
    "Premium NPK 20:20:20 Fertilizer": ["/images/services/soil.png"],
    "20L Heavy Duty Knapsack Sprayer": ["/images/services/crop_production.png"],
    "Duduthrin Broad-Spectrum Insecticide": ["/images/services/crop_production.png"],
    "Seaweed Organic Growth Booster": ["/images/services/soil.png"]
  };

  for (const prod of products) {
    const replacement = productFallbackMap[prod.name] || ["/placeholder-product.png"];
    await sql`UPDATE products SET image_urls = ${replacement} WHERE id = ${prod.id}`;
    console.log(`Updated product [${prod.name}] image_urls to local paths.`);
  }

  console.log("DB Sanitization complete!");
  process.exit(0);
}

sanitize().catch((err) => {
  console.error("Sanitization error:", err);
  process.exit(1);
});
