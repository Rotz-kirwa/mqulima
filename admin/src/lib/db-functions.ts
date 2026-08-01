import postgres from "postgres";
import process from "node:process";

let sql: ReturnType<typeof postgres> | null = null;
let schemaPatched = false;

async function autoPatchSchema(sqlInstance: ReturnType<typeof postgres>) {
  if (schemaPatched) return;
  schemaPatched = true;
  try {
    await sqlInstance`
      ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS bio TEXT,
        ADD COLUMN IF NOT EXISTS website TEXT,
        ADD COLUMN IF NOT EXISTS cover_image TEXT,
        ADD COLUMN IF NOT EXISTS farming_activities TEXT,
        ADD COLUMN IF NOT EXISTS farming_photos TEXT[] DEFAULT '{}';
    `;

    const [{ count }] = await sqlInstance`SELECT count(*)::int FROM products WHERE is_featured = true AND deleted_at IS NULL`;
    if (count === 0) {
      await sqlInstance`
        INSERT INTO products (name, slug, description, base_price, original_price, stock_qty, is_featured, avg_rating, rating_count, status, brand, seller, county, unit, badge, organic, verified_seller, seller_score, condition, shop_type, field, subcategory, image_urls)
        VALUES
          (
            'Premium NPK 20:20:20 Fertilizer',
            'premium-npk-20-20-20-fertilizer',
            'High-purity water-soluble NPK 20:20:20 balanced fertilizer designed to boost plant growth, flowering, and root health.',
            3200.00, 3600.00, 250, TRUE, 4.9, 32, 'active', 'Yara', 'Mculima Supplies', 'Nairobi', '50kg bag', 'Bestseller', FALSE, TRUE, 98, 'New', 'Agrovet', 'Fertilizers', 'Planting',
            ARRAY['https://i.pinimg.com/1200x/30/51/f4/3051f4e634474dad5df2920d1b7e763a.jpg']
          ),
          (
            'Lambda-Cyhalothrin 10EC Insecticide',
            'lambda-cyhalothrin-10ec-insecticide',
            'Fast-acting synthetic pyrethroid insecticide for controlling caterpillars, aphids, thrips, and beetles on crops.',
            1450.00, 1600.00, 180, TRUE, 4.8, 27, 'active', 'Pomais', 'AgroChem Supplies', 'Nairobi', '1L bottle', 'Best Seller', FALSE, TRUE, 96, 'New', 'Agrovet', 'Crop Protection', 'Insecticides',
            ARRAY['https://www.pomais.com/wp-content/uploads/2024/12/Lambda-cyhalothrin10EC-.webp']
          ),
          (
            'Seaweed Organic Growth Booster',
            'seaweed-organic-growth-booster',
            '100% natural cold-pressed seaweed extract biostimulant. Enhances root expansion, stress tolerance, and crop yields.',
            2100.00, 2400.00, 140, TRUE, 4.9, 41, 'active', 'BioGrow', 'Organic Farm Solutions', 'Nakuru', '1L bottle', 'Organic', TRUE, TRUE, 99, 'Certified Organic', 'Agrovet', 'Plant Growth & Boosters', 'Biostimulants',
            ARRAY['https://i.pinimg.com/736x/b4/9e/55/b49e55253e882f51514c8a028dda76bd.jpg']
          ),
          (
            '20L Heavy Duty Knapsack Sprayer',
            '20l-heavy-duty-knapsack-sprayer',
            'Ergonomic 20-litre manual knapsack sprayer with heavy-duty pump handle, brass lance, and multi-pattern nozzles.',
            4800.00, 5200.00, 65, TRUE, 4.7, 19, 'active', 'Harvester Tools', 'Equipment Direct', 'Nairobi', '1 unit', 'Hot Deal', FALSE, TRUE, 94, 'New', 'Agrovet', 'Farm Equipment', 'Machinery',
            ARRAY['https://i.pinimg.com/1200x/74/d7/66/74d766c45e79615e4028f5d86cb1a63d.jpg']
          ),
          (
            'Duduthrin Broad-Spectrum Insecticide',
            'duduthrin-broad-spectrum-insecticide',
            'Broad-spectrum EC insecticide formulation effective against cutworms, armyworms, whiteflies, and diamondback moths.',
            1200.00, 1350.00, 95, TRUE, 4.8, 22, 'active', 'Twiga Chemical', 'Twiga Agrovet', 'Kiambu', '500ml', 'Popular', FALSE, TRUE, 97, 'New', 'Agrovet', 'Crop Protection', 'Insecticides',
            ARRAY['https://i.pinimg.com/736x/e6/29/38/e62938172d5b057b027f3de816b373e2.jpg']
          ),
          (
            'High-Yield Layer Chicken Feed',
            'high-yield-layer-chicken-feed',
            'Nutrient-balanced complete laying mash formulated with essential calcium, amino acids, and energy for maximum egg output.',
            3250.00, 3500.00, 310, TRUE, 4.9, 38, 'active', 'Unga Feeds', 'Unga Farmcare', 'Nakuru', '70kg bag', 'Top Feed', FALSE, TRUE, 98, 'Fresh', 'Agrovet', 'Animal Farming', 'Animal Feed',
            ARRAY['https://www.myagrovet.co.ke/images/products/7367/thumb_44e1a1ca768bb3add788ec4afd3b0a57.png']
          )
        ON CONFLICT (slug) DO UPDATE SET is_featured = true, status = 'active';
      `;
    }
  } catch (err) {
    console.warn("[WARN] Admin Auto-patch schema notice:", err);
  }
}

export function getDb() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL || "postgresql://mqulima:password@localhost:5432/mqulima_dev";

    if (!connectionString) {
      throw new Error("[FATAL] Unable to initialize Admin PostgreSQL pool: DATABASE_URL is missing or unconfigured.");
    }

    const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1") || connectionString.includes("::1");
    sql = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });

    autoPatchSchema(sql).catch(() => {});
  }
  return sql;
}

export type Sql = ReturnType<typeof postgres>;
