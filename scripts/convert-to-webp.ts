import fs from "fs";
import path from "path";
import sharp from "sharp";
import postgres from "postgres";

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

const dbUrl = process.env.DATABASE_URL || "";
const parsedDbUrl = dbUrl.includes("Mq@Hub#Dev2026!")
  ? dbUrl.replace("Mq@Hub#Dev2026!", "Mq%40Hub%23Dev2026%21")
  : dbUrl;

const SIZES = [320, 640, 960, 1280];

interface ConversionStat {
  originalFile: string;
  originalSize: number;
  webpSize: number;
  savingsPercent: number;
  variants: string[];
}

async function convertImage(filePath: string): Promise<ConversionStat | null> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
    return null;
  }

  // Skip app icons and special files
  const base = path.basename(filePath);
  if (base.startsWith("icon-") || base.includes("favicon") || base.endsWith(".webp")) {
    return null;
  }

  const dir = path.dirname(filePath);
  const nameWithoutExt = path.basename(filePath, ext);
  const webpPath = path.join(dir, `${nameWithoutExt}.webp`);

  const stat = fs.statSync(filePath);
  const originalSize = stat.size;

  const image = sharp(filePath);
  const metadata = await image.metadata();
  const width = metadata.width || 1200;
  const isCover = filePath.includes("news") || filePath.includes("hero") || filePath.includes("cover");
  const quality = isCover ? 85 : 80;

  // 1. Convert main image to webp
  await sharp(filePath)
    .webp({ quality, effort: 4 })
    .toFile(webpPath);

  const mainWebpStat = fs.statSync(webpPath);
  const variants: string[] = [webpPath];

  // 2. Generate responsive sizes: 320, 640, 960, 1280
  for (const targetW of SIZES) {
    if (targetW <= width * 1.2) {
      const variantPath = path.join(dir, `${nameWithoutExt}-${targetW}w.webp`);
      await sharp(filePath)
        .resize({ width: Math.min(targetW, width), withoutEnlargement: true })
        .webp({ quality, effort: 4 })
        .toFile(variantPath);
      variants.push(variantPath);
    }
  }

  // 3. Generate 20w tiny blur placeholder
  const blurPath = path.join(dir, `${nameWithoutExt}-blur.webp`);
  await sharp(filePath)
    .resize(20)
    .webp({ quality: 20 })
    .toFile(blurPath);
  variants.push(blurPath);

  const savingsPercent = Math.round(((originalSize - mainWebpStat.size) / originalSize) * 100);

  return {
    originalFile: filePath,
    originalSize,
    webpSize: mainWebpStat.size,
    savingsPercent,
    variants,
  };
}

async function findFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await findFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

async function main() {
  console.log("=== Mqulima WebP Conversion & Responsive Image Generation ===");
  const targetDirs = [
    "public/images/news",
    "public/images/services",
    "public/about",
    "public/images",
    "public/images/self-hosted",
    "src/assets",
  ];

  let totalOriginalBytes = 0;
  let totalWebpBytes = 0;
  const stats: ConversionStat[] = [];

  for (const targetDir of targetDirs) {
    if (!fs.existsSync(targetDir)) continue;
    const files = await findFiles(targetDir);
    for (const file of files) {
      try {
        const res = await convertImage(file);
        if (res) {
          stats.push(res);
          totalOriginalBytes += res.originalSize;
          totalWebpBytes += res.webpSize;
          console.log(`✓ ${path.relative("public", res.originalFile)} -> .webp (${Math.round(res.originalSize / 1024)}KB -> ${Math.round(res.webpSize / 1024)}KB, saved ${res.savingsPercent}%) [+${res.variants.length - 1} responsive variants]`);
        }
      } catch (err) {
        console.error(`Error converting ${file}:`, err);
      }
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Converted ${stats.length} images.`);
  console.log(`Original total: ${(totalOriginalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`WebP total:     ${(totalWebpBytes / 1024 / 1024).toFixed(2)} MB`);
  const totalSaved = Math.round(((totalOriginalBytes - totalWebpBytes) / totalOriginalBytes) * 100);
  console.log(`Total storage reduction: ${totalSaved}%`);

  // 4. Update DB references for news articles to .webp
  if (parsedDbUrl) {
    try {
      console.log("\nConnecting to database to update news media_urls to .webp...");
      const sql = postgres(parsedDbUrl, { max: 1, ssl: { rejectUnauthorized: false } });
      const articles = await sql`SELECT id, slug, media_url FROM agritech_news`;
      let updatedCount = 0;
      for (const a of articles) {
        if (a.media_url && (a.media_url.endsWith(".jpg") || a.media_url.endsWith(".png"))) {
          const newUrl = a.media_url.replace(/\.(jpg|jpeg|png)$/i, ".webp");
          await sql`UPDATE agritech_news SET media_url = ${newUrl} WHERE id = ${a.id}`;
          updatedCount++;
        }
      }
      console.log(`Updated ${updatedCount} article media_urls in DB to .webp.`);
      await sql.end();
    } catch (e) {
      console.warn("Could not connect to DB to update media_url:", (e as Error).message);
    }
  }
}

main().catch(console.error);
