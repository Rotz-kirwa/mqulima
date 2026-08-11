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

async function seed() {
  console.log("Seeding distinct Agritech News articles...");

  // Article 1: El Nino (Weather Advisory)
  const art1Content = `<p><strong>El Niño</strong> is a natural climate pattern associated with unusually warm ocean temperatures in the central and eastern tropical Pacific. Although it begins thousands of kilometres away from East Africa, it can significantly influence rainfall and temperature patterns across the region.</p><p>For Kenyan farmers, understanding El Niño is important because changes in rainfall can create both <strong>opportunities and serious agricultural risks</strong>.</p><h2>🌦️ How El Niño Affects Kenya</h2><p>El Niño is commonly associated with increased rainfall across parts of East Africa, particularly during the <strong>October–December short-rains season</strong>. However, its effects are not identical everywhere, and rainfall responses can vary depending on the strength, timing and interaction of El Niño with other climate systems.</p><p>Heavy rainfall can replenish water sources and improve soil moisture, but excessive rain can also cause <strong>flooding, soil erosion, waterlogging and crop damage</strong>.</p><p>Kenya's experience during previous El Niño events demonstrates how significant these impacts can be. The Kenya Meteorological Department reported that the 2023 combination of El Niño and a strong positive Indian Ocean Dipole contributed to above-normal rainfall in many areas, alongside severe flooding, crop and livestock losses and infrastructure damage.</p><h2>🌽 What Does El Niño Mean for Farmers?</h2><p>For farmers, more rainfall does not automatically mean a better harvest.</p><p>Excessive rainfall can:</p><ul><li>Flood farms and destroy crops</li><li>Cause soil erosion and nutrient loss</li><li>Create waterlogged conditions</li><li>Increase fungal and other crop diseases</li><li>Damage roads used to transport farm produce</li><li>Disrupt harvesting and post-harvest handling</li><li>Increase livestock disease risks</li></ul><p>At the same time, adequate rainfall can improve <strong>water availability, pasture conditions and crop establishment</strong>, particularly where farmers have prepared their farms properly.</p><h2>🧑‍🌾 How Farmers Can Prepare</h2><p>Farmers can reduce their exposure to extreme rainfall by taking practical measures before the rains intensify.</p><h3>1. Improve Farm Drainage</h3><p>Clear drainage channels and ensure excess water can leave the farm without causing erosion.</p><h3>2. Protect the Soil</h3><p>Mulching, maintaining ground cover and using appropriate soil-conservation practices can help reduce erosion caused by heavy rainfall.</p><h3>3. Use Climate Information</h3><p>Farmers should monitor reliable seasonal forecasts and local weather updates before making decisions about planting, fertilizer application and harvesting.</p><h3>4. Protect Harvests</h3><p>Farmers should prepare adequate drying, storage and transportation arrangements before periods of heavy rainfall.</p><h2>🌱 El Niño and the Future of Kenyan Agriculture</h2><p>Climate variability is making agricultural decision-making increasingly dependent on timely information.</p><p>For farmers, weather forecasts are becoming as important as information about <strong>seed, fertilizer and market prices</strong>.</p><p><strong>Mqulima — turning climate information into better farming decisions.</strong></p>`;

  // Article 2: Fuerte Avocados (Agronomy & Farm Tips)
  const art2Content = `<p><strong>Fuerte avocado</strong> is one of the established avocado varieties grown in Kenya and remains an important fruit for both domestic and commercial markets. Alongside Hass and other varieties, Fuerte forms part of Kenya’s avocado value chain, providing opportunities for farmers, traders and agribusinesses.</p><h2>What Makes Fuerte Avocado Different?</h2><p>Fuerte is a hybrid avocado variety associated with the Mexican race and is well suited to Kenya's midland and highland production areas. KALRO identifies Fuerte among the important avocado varieties grown in Kenya and notes that Mexican and Guatemalan varieties generally perform well in Kenya's midlands and highlands.</p><p>The fruit typically remains green when mature, unlike Hass, which develops a darker skin as it ripens. This means farmers need to pay close attention to maturity indicators when determining the right harvesting time.</p><h2>💰 Fuerte Avocado Price Per Kilogram</h2><p>The price of Fuerte avocado varies depending on <strong>location, season, fruit quality, supply, demand, market channel and whether the transaction is wholesale or retail</strong>.</p><p>For example, a recorded market entry from Gakoromone Market in Meru showed Fuerte avocado at <strong>KSh 200 per kg wholesale and KSh 250 per kg retail</strong>. Market prices can change considerably, so farmers should check current local market information before making selling decisions.</p><h3>What Determines the Price?</h3><p>Several factors influence the price farmers receive:</p><ul><li><strong>Fruit size and grade</strong></li><li><strong>Quality and maturity</strong></li><li><strong>Seasonal supply</strong></li><li><strong>Local market demand</strong></li><li><strong>Export demand</strong></li><li><strong>Distance to market</strong></li><li><strong>Post-harvest handling</strong></li><li><strong>Volume being sold</strong></li></ul><h2>🌱 Production Potential</h2><p>Avocado can become a valuable long-term enterprise when farmers select suitable varieties, planting sites and management practices.</p><p>KALRO's avocado production guidance indicates that yields increase substantially as trees mature. Its factsheet reports approximately <strong>300–400 kg per hectare for 3–5-year-old trees</strong> and <strong>800–1,000 kg for trees older than five years</strong>.</p><h2>⚠️ Post-Harvest Handling Matters</h2><p>Avocados are highly sensitive to post-harvest handling. Poor harvesting, bruising, delayed cooling and inadequate storage can significantly reduce quality and market value.</p><p>KALRO recommends rapid cooling after harvest and identifies approximately <strong>5°C as an optimum storage temperature for Fuerte and Hass varieties</strong> in its post-harvest guidance.</p><h2>🧑‍🌾 Mqulima Market Insight</h2><p>Fuerte avocado prices should be viewed as <strong>market indicators rather than fixed prices</strong>. Farmers should compare farm-gate, wholesale and retail prices while considering transport, grading, packaging and other transaction costs.</p><p><strong>Bottom line:</strong> Fuerte avocado remains an important Kenyan avocado variety with opportunities across the domestic and commercial value chains.</p>`;

  // Article 3: Galana-Kulalu Irrigation Scheme (Policy & Market)
  const art3Content = `<p><strong>Galana-Kulalu Irrigation Scheme</strong> is one of Kenya’s major agricultural development projects, designed to expand large-scale irrigation, increase national food production, and strengthen the country’s long-term food security.</p><p>Spanning parts of Kilifi and Tana River counties, the project targets thousands of acres for mechanized crop production, focusing on staple crops such as maize, alongside livestock and horticultural production.</p><h2>🌾 Key Objectives & Infrastructure</h2><p>The main goal of the Galana-Kulalu initiative is to transition Kenyan agriculture from rain-fed dependence to reliable, tech-enabled irrigation infrastructure.</p><ul><li><strong>Water Abstraction:</strong> Harnessing water from the Tana River to feed extensive canal networks and modern pivot irrigation systems.</li><li><strong>Staple Grain Reserves:</strong> Boosting national strategic grain reserves to stabilize food prices across urban and rural markets.</li><li><strong>Public-Private Partnerships (PPP):</strong> Partnering with private investors and commercial agricultural enterprises to maximize yield per hectare.</li></ul><h2>📈 Opportunities for Farmers & Agribusinesses</h2><p>Beyond state-level food security, Galana-Kulalu creates vital economic opportunities across the coastal and national agricultural supply chains:</p><ul><li>Enhanced seed and fertilizer distribution networks.</li><li>Post-harvest storage and modern grain milling services.</li><li>Employment and technical skills development in mechanized farming.</li></ul><h2>🧑‍🌾 Mqulima Policy & Market Insight</h2><p>Large-scale irrigation projects like Galana-Kulalu demonstrate the shift towards sustainable, climate-resilient farming in Kenya. Integrating efficient water management with market intelligence ensures that local farmers benefit from price stability and dependable supply chains.</p><p><strong>Mqulima — turning climate information and market intelligence into better farming decisions.</strong></p>`;

  // 1. Weather Advisory
  await sql`
    INSERT INTO agritech_news (
      id, title, slug, summary, content, category, media_type, media_url, source_attribution, status, published_at
    ) VALUES (
      'news-el-nino-kenya',
      'El Niño in Kenya: What Farmers Need to Know',
      'el-nino-in-kenya-what-farmers-need-to-know',
      'Understanding El Niño climate risks, rainfall forecasts, drainage improvements, and crop management strategies for Kenyan farmers.',
      ${art1Content},
      'Weather Advisory',
      'image',
      'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80',
      'KALRO / Mqulima Editorial Desk',
      'published',
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      content = EXCLUDED.content,
      category = EXCLUDED.category,
      published_at = NOW();
  `;

  // 2. Agronomy & Farm Tips
  await sql`
    INSERT INTO agritech_news (
      id, title, slug, summary, content, category, media_type, media_url, source_attribution, status, published_at
    ) VALUES (
      'news-fuerte-avocado-kenya',
      'Fuerte Avocados (Kg) in Kenya: Market Prices, Production and Opportunities for Farmers',
      'fuerte-avocados-in-kenya-market-prices-and-opportunities',
      'Comprehensive guide on Fuerte avocado market pricing per kg, KALRO yield guidance, elevation suitability, and post-harvest cold chain management.',
      ${art2Content},
      'Agronomy & Farm Tips',
      'image',
      'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=1200&q=80',
      'Mqulima Agronomy Desk',
      'published',
      NOW() - INTERVAL '1 hour'
    ) ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      content = EXCLUDED.content,
      category = EXCLUDED.category,
      published_at = NOW() - INTERVAL '1 hour';
  `;

  // 3. Policy & Market
  await sql`
    INSERT INTO agritech_news (
      id, title, slug, summary, content, category, media_type, media_url, source_attribution, status, published_at
    ) VALUES (
      'news-galana-kulalu-scheme',
      'Galana-Kulalu Irrigation Scheme: Kenya’s Ambitious Drive to Transform Agriculture',
      'galana-kulalu-irrigation-scheme-kenya',
      'Overview of the Galana-Kulalu mega irrigation project in Kilifi & Tana River, Tana River water abstraction, pivot irrigation, and grain reserve stabilization.',
      ${art3Content},
      'Policy & Market',
      'image',
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
      'Ministry of Water & Irrigation / Mqulima Desk',
      'published',
      NOW() - INTERVAL '2 hours'
    ) ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      content = EXCLUDED.content,
      category = EXCLUDED.category,
      published_at = NOW() - INTERVAL '2 hours';
  `;

  console.log("Successfully seeded 3 distinct Agritech News articles!");
  process.exit(0);
}

seed();
