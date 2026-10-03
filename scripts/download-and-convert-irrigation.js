import fs from "fs";
import path from "path";
import sharp from "sharp";

const IMAGE_URL = "https://i.pinimg.com/1200x/97/33/89/9733893e596f864d0c7b80ee271d350d.jpg";
const OUTPUT_DIR = path.resolve("public/images/services");

async function main() {
  console.log("Fetching image from:", IMAGE_URL);
  const response = await fetch(IMAGE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.log(`Fetched ${buffer.length} bytes.`);

  // Save original jpg
  const jpgPath = path.join(OUTPUT_DIR, "irrigation.jpg");
  fs.writeFileSync(jpgPath, buffer);
  console.log("Saved original to:", jpgPath);

  // Convert to full webp
  const webpPath = path.join(OUTPUT_DIR, "irrigation.webp");
  await sharp(buffer)
    .webp({ quality: 85 })
    .toFile(webpPath);
  console.log("Converted main webp to:", webpPath);

  // Create responsive variants
  const SIZES = [320, 640, 960, 1280];
  for (const size of SIZES) {
    const variantPath = path.join(OUTPUT_DIR, `irrigation-${size}w.webp`);
    await sharp(buffer)
      .resize({ width: size, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(variantPath);
    console.log(`Generated variant: ${variantPath}`);
  }

  // Create blur placeholder
  const blurPath = path.join(OUTPUT_DIR, "irrigation-blur.webp");
  await sharp(buffer)
    .resize({ width: 20 })
    .webp({ quality: 20 })
    .toFile(blurPath);
  console.log("Generated blur placeholder:", blurPath);

  console.log("Irrigation images successfully updated!");
}

main().catch(err => {
  console.error("Error in download-and-convert-irrigation:", err);
  process.exit(1);
});
