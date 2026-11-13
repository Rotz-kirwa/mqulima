import { getDb, getDrizzleDb } from "../db.server";
import { products, productVariants } from "@/db/schema/products";
import { eq, or } from "drizzle-orm";
import { resolveFastProductImage } from "../api/shop.server";
import { cleanDescriptionText } from "../shop-data";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function handleListProducts(request: Request, url: URL): Promise<Response> {
  try {
    const category = url.searchParams.get("category") || "All";
    const subcategory = url.searchParams.get("subcategory") || "All";
    const q = url.searchParams.get("q") || url.searchParams.get("search") || "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(1000, Math.max(1, parseInt(url.searchParams.get("limit") || "24", 10)));
    const offset = (page - 1) * limit;

    const sql = getDb();
    let whereClause = sql`p.status = 'active' AND p.deleted_at IS NULL AND p.external_product_id IS NOT NULL`;

    if (category && category !== "All") {
      whereClause = sql`${whereClause} AND (p.field ILIKE ${category} OR p.subcategory ILIKE ${category} OR sc.name ILIKE ${category} OR pc.name ILIKE ${category})`;
    }
    if (subcategory && subcategory !== "All") {
      whereClause = sql`${whereClause} AND (p.subcategory ILIKE ${subcategory} OR ss.name ILIKE ${subcategory})`;
    }
    if (q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      whereClause = sql`${whereClause} AND (p.name ILIKE ${searchTerm} OR p.description ILIKE ${searchTerm} OR p.brand ILIKE ${searchTerm})`;
    }

    const [rows, countRes] = await Promise.all([
      sql`
        SELECT 
          p.id, p.external_product_id, p.name, p.slug, p.description, 
          p.base_price, p.stock_qty, p.status, p.field, p.subcategory, 
          p.brand, p.seller, p.county, p.unit, p.image_urls, p.is_featured,
          p.avg_rating, p.rating_count, p.created_at,
          COALESCE(sc.name, pc.name, p.field, p.subcategory) AS category_name
        FROM products p
        LEFT JOIN shop_categories sc ON p.category_id = sc.id
        LEFT JOIN shop_subcategories ss ON p.subcategory_id = ss.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE ${whereClause}
        ORDER BY (p.stock_qty > 0) DESC, p.created_at DESC, p.id ASC
        LIMIT ${limit} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*)::int as count
        FROM products p
        LEFT JOIN shop_categories sc ON p.category_id = sc.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE ${whereClause}
      `,
    ]);

    const total = countRes[0]?.count || 0;
    const pages = Math.ceil(total / limit) || 1;

    const productIds = rows.map((p: any) => p.id);
    const variantRows = productIds.length > 0
      ? await sql`
          SELECT id, product_id, variant_label, price, stock_qty, sku
          FROM product_variants
          WHERE product_id = ANY(${productIds})
        `
      : [];
    const variantsByProd = new Map<string, any[]>();
    for (const v of variantRows) {
      const pid = String(v.product_id);
      const arr = variantsByProd.get(pid) || [];
      arr.push({
        id: v.id,
        variantLabel: v.variant_label,
        price: Number(v.price) || 0,
        stock: v.stock_qty ?? 0,
        sku: v.sku || "N/A",
      });
      variantsByProd.set(pid, arr);
    }

    const items = rows.map((p: any) => {
      const imageUrl = resolveFastProductImage(p);
      return {
        id: p.id,
        externalProductId: p.external_product_id,
        name: p.name,
        price: Number(p.base_price) || 0,
        stock: p.stock_qty ?? 0,
        field: p.field || "",
        category: p.category_name || p.field || p.subcategory || "General",
        subcategory: p.subcategory || "",
        brand: p.brand && !/smooth\s*sale/i.test(p.brand) ? p.brand : "Verified Agrovet Partner",
        seller: p.seller || "Kirgit Agri Depot",
        county: p.county || "Kenya",
        unit: p.unit || "Unit",
        image: imageUrl,
        images: Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls : [imageUrl],
        variations: variantsByProd.get(String(p.id)) || [],
        rating: Number(p.avg_rating) || 5.0,
        ratingCount: p.rating_count || 0,
        featured: Boolean(p.is_featured),
        description: cleanDescriptionText(p.description) || "Genuine certified agricultural input for farm use.",
        createdAt: p.created_at,
      };
    });

    return new Response(
      JSON.stringify({ success: true, items, total, page, pages }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=30, s-maxage=60",
        },
      }
    );
  } catch (err: any) {
    console.error("[API/V1/PRODUCTS ERROR]:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to fetch products" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

const FEATURED_DEFAULTS: Record<string, { price: number; category: string; brand: string; description: string; productId: string }> = {
  "feat-farm-tools": {
    productId: "farm-tools-set",
    price: 1200,
    category: "Farm Equipment",
    brand: "Certified Farm Tools",
    description: "Durable forged steel hand tools for everyday farm cultivation — jembe, panga, rake, and pruners from certified manufacturers.",
  },
  "20l-heavy-duty-knapsack-sprayer": {
    productId: "20l-heavy-duty-knapsack-sprayer",
    price: 4800,
    category: "Farm Equipment",
    brand: "AgroPro Equipment",
    description: "Heavy-duty 20-litre manual knapsack sprayer with adjustable solid brass lance, padded shoulder harness, and internal pressure chamber.",
  },
  "smoothsale-high-protein-dairy-mash": {
    productId: "smoothsale-high-protein-dairy-mash",
    price: 2900,
    category: "Animal Feeds",
    brand: "Verified Feeds",
    description: "Nutrient-balanced high-protein dairy mash formulated to boost daily milk yield and maintain prime cow body condition.",
  },
  "high-yield-layer-chicken-feed": {
    productId: "high-yield-layer-chicken-feed",
    price: 3250,
    category: "Animal Feeds",
    brand: "Unga Feeds",
    description: "Complete balanced layers mash enriched with digestible calcium, methionine, and essential amino acids for strong egg shells.",
  },
  "high-protein-dairy-meal": {
    productId: "high-protein-dairy-meal",
    price: 2950,
    category: "Animal Feeds",
    brand: "Pembe Feeds",
    description: "Premium commercial dairy meal with bypass protein, phosphorus, and trace minerals designed for high-producing dairy cows.",
  },
  "smoothsale-motorized-backpack-knapsack-sprayer": {
    productId: "smoothsale-motorized-backpack-knapsack-sprayer",
    price: 14500,
    category: "Farm Equipment",
    brand: "AgroPro Equipment",
    description: "2-stroke petrol-powered 25L motorized backpack mist blower sprayer for rapid pest and blight control across orchards and crop fields.",
  },
  "smoothsale-npk-17-17-17-fertilizer": {
    productId: "smoothsale-npk-17-17-17-fertilizer",
    price: 4200,
    category: "Fertilizers",
    brand: "Yara East Africa",
    description: "Balanced compound granular fertilizer containing equal proportions of Nitrogen, Phosphorus, and Potassium (17:17:17) for planting and vigorous growth.",
  },
  "premium-npk-20-20-20-fertilizer": {
    productId: "premium-npk-20-20-20-fertilizer",
    price: 3200,
    category: "Fertilizers",
    brand: "Murphy Chemicals",
    description: "100% water-soluble crystalline foliar and fertigation fertilizer with chelated trace elements for rapid nutrient uptake.",
  },
  "seaweed-organic-growth-booster": {
    productId: "seaweed-organic-growth-booster",
    price: 2100,
    category: "Fertilizers",
    brand: "Organic Solutions",
    description: "Cold-pressed pure organic Ascophyllum nodosum seaweed extract biostimulant that accelerates root development and flowering.",
  },
  "smoothsale-belt-480sc-fungicide": {
    productId: "belt-expert-480sc",
    price: 1800,
    category: "Inputs & Agrochemicals",
    brand: "Bayer CropScience",
    description: "Broad-spectrum systemic crop protection concentrate for fast knockdown and long-lasting residual protection.",
  },
  "lambda-cyhalothrin-10ec-insecticide": {
    productId: "lambda-cyhalothrin-10ec-insecticide",
    price: 1450,
    category: "Inputs & Agrochemicals",
    brand: "Syngenta / Osho",
    description: "High-activity pyrethroid insecticide for rapid control of caterpillars, aphids, thrips, whiteflies, and beetles in vegetables and cereals.",
  },
  "duduthrin-broad-spectrum-insecticide": {
    productId: "duduthrin-175ec",
    price: 1200,
    category: "Inputs & Agrochemicals",
    brand: "Twiga Chemical Industries",
    description: "Trusted broad-spectrum contact and stomach pyrethroid insecticide for controlling caterpillars, aphids, thrips, and bollworms.",
  },
  "poultry-feeder-and-drinker-set": {
    productId: "poultry-feeder-and-drinker-set",
    price: 950,
    category: "Farm Equipment",
    brand: "Kenchic Poultry Gear",
    description: "Heavy-duty UV-stabilized plastic poultry feeder and automatic bell drinker set designed to prevent feed spillage and water contamination.",
  },
  "poultry-feeding-trough": {
    productId: "poultry-feeding-trough",
    price: 850,
    category: "Farm Equipment",
    brand: "AgroEquip Kenya",
    description: "Rust-resistant galvanized steel poultry linear feeding trough with anti-perch spinning reel for clean, waste-free flock feeding.",
  },
  "kenya-seed-h614d-hybrid-maize-seed-2kg": {
    productId: "h614d-hybrid-maize-seed",
    price: 620,
    category: "Seeds",
    brand: "Kenya Seed Company",
    description: "Certified Kenya Seed H614D highland hybrid maize seed (2kg) renowned for double cobbing, strong stalk strength, and high grain yield.",
  },
  "easeed-rosecoco-glp-2-certified-bean-seeds-2kg": {
    productId: "easeed-rosecoco-glp-2-certified-bean-seeds-2kg",
    price: 680,
    category: "Seeds",
    brand: "East African Seed (EASEED)",
    description: "Certified GLP-2 Rosecoco bush bean seeds (2kg) with fast maturity (75-85 days), high market demand, and disease tolerance.",
  },
  "seed-co-sc-duma-43-hybrid-maize-seed-2kg": {
    productId: "seed-co-sc-duma-43-hybrid-maize-seed-2kg",
    price: 650,
    category: "Seeds",
    brand: "Seed Co Kenya",
    description: "Early-maturing drought-tolerant SC Duma 43 hybrid maize seed (2kg) engineered for medium-to-low altitude agro-ecological zones.",
  },
  "greenlife-red-coach-f1-hybrid-onion-seeds": {
    productId: "greenlife-red-coach-f1-hybrid-onion-seeds",
    price: 1850,
    category: "Seeds",
    brand: "Greenlife Crop Protection",
    description: "High-yielding Red Coach F1 hybrid bulb onion seeds producing uniform, deep-red pungent globes with long post-harvest shelf life.",
  },
  "baraka-fertilizer-50kg": {
    productId: "baraka-fertilizer-50kg",
    price: 3850,
    category: "Fertilizers",
    brand: "Toyota Tsusho / Baraka",
    description: "Custom-blended Baraka Potato & Onion 50kg compound fertilizer enriched with sulphur, calcium, and boron for maximum tuber and bulb size.",
  },
  "ckl-maclik-super-dairy-mineral-supplement-5kg": {
    productId: "ckl-maclik-super-dairy-mineral-supplement-5kg",
    price: 1350,
    category: "Animal Feeds",
    brand: "Cooper K-Brands (CKL)",
    description: "High-phosphorus Maclik Super dairy mineral powder (5kg) formulated for lactating cows to boost milk production and fertility.",
  },
};

export async function handleFeaturedProducts(): Promise<Response> {
  try {
    const sql = getDb();

    // 1. Query curated featured_items table (exact same source of truth as mqulima.com)
    let featItems: any[] = [];
    try {
      featItems = await sql`
        SELECT fi.id, fi.title, fi.image_url, fi.link_url, fi.position, fi.entity_type, fi.entity_id,
               p.id as prod_id, p.name as prod_name, p.slug as prod_slug, p.base_price, p.stock_qty,
               p.brand, p.description, p.avg_rating, p.image_urls as prod_image_urls,
               COALESCE(sc.name, pc.name, p.subcategory) AS category_name
        FROM featured_items fi
        LEFT JOIN products p ON (
          (fi.entity_id IS NOT NULL AND fi.entity_id != 'custom' AND fi.entity_id = p.id::text)
          OR (p.slug IS NOT NULL AND fi.link_url LIKE '%' || p.slug)
          OR (LOWER(p.name) = LOWER(fi.title))
        )
        LEFT JOIN shop_categories sc ON p.category_id = sc.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        ORDER BY fi.position ASC
      `;
    } catch (e) {
      console.warn("[API/V1/FEATURED] featured_items query error:", e);
    }

    if (featItems.length > 0) {
      const items = featItems.map((fi: any) => {
        const slug = fi.prod_slug || (fi.link_url?.replace(/^.*\/shop\/product\//, "").replace(/\/$/, "") || fi.id);
        const def = FEATURED_DEFAULTS[slug] || FEATURED_DEFAULTS[fi.id];
        const image = (fi.image_url && !fi.image_url.includes("default.png"))
          ? fi.image_url
          : (fi.prod_name ? resolveFastProductImage({ name: fi.prod_name, image_urls: fi.prod_image_urls }) : "/images/placeholders/farm_tools.webp");

        return {
          id: fi.prod_id || def?.productId || slug || fi.id,
          featuredItemId: fi.id,
          slug,
          name: fi.title || fi.prod_name || "Farm Essential",
          price: Number(fi.base_price) || def?.price || 1500,
          stock: Number(fi.stock_qty ?? 45),
          category: fi.category_name || def?.category || "Farm Essentials",
          brand: (fi.brand && !/smooth\s*sale/i.test(fi.brand)) ? fi.brand : (def?.brand || "Verified Input"),
          description: cleanDescriptionText(fi.description) || def?.description || "Certified genuine agricultural input for farm use.",
          image,
          images: [image],
          linkUrl: fi.link_url || `/shop/product/${slug}`,
          position: fi.position,
          rating: Number(fi.avg_rating) || 4.8,
          featured: true,
        };
      });

      return new Response(JSON.stringify(items), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      });
    }

    // Fallback to products.is_featured if featured_items table is empty
    const rows = await sql`
      SELECT p.*, COALESCE(sc.name, pc.name, p.subcategory) AS category_name
      FROM products p
      LEFT JOIN shop_categories sc ON p.category_id = sc.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.status = 'active' AND p.deleted_at IS NULL AND p.external_product_id IS NOT NULL AND p.is_featured = true
      ORDER BY (p.stock_qty > 0) DESC, p.created_at DESC
      LIMIT 20
    `;

    const items = rows.map((p: any) => {
      const imageUrl = resolveFastProductImage(p);
      return {
        id: p.id,
        name: p.name,
        price: Number(p.base_price) || 0,
        stock: p.stock_qty ?? 0,
        category: p.category_name || p.subcategory || "General",
        brand: p.brand || "Verified Input",
        image: imageUrl,
        rating: Number(p.avg_rating) || 5.0,
        featured: true,
      };
    });

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to fetch featured products" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleGetProduct(identifier: string): Promise<Response> {
  try {
    const db = getDrizzleDb();
    const idOrSlugWhere = UUID_RE.test(identifier)
      ? eq(products.id, identifier)
      : or(eq(products.slug, identifier), eq(products.externalProductId, identifier));

    const match = await db.select().from(products).where(idOrSlugWhere).limit(1);
    if (!match.length) {
      return new Response(
        JSON.stringify({ success: false, error: "Product not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const p = match[0];
    const variants = await db.select().from(productVariants).where(eq(productVariants.productId, p.id));
    const mainImg = resolveFastProductImage(p);

    return new Response(
      JSON.stringify({
        id: p.id,
        name: p.name,
        price: Number(p.basePrice) || 0,
        stock: p.stockQty ?? 0,
        category: p.subcategory || p.shopType || "General",
        brand: p.brand || "Verified Input",
        seller: p.seller || "Kirgit Agri Depot",
        county: p.county || "Kenya",
        unit: p.unit || "Unit",
        image: mainImg,
        images: p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls : [mainImg],
        description: cleanDescriptionText(p.description) || "Certified genuine agricultural input for farm use.",
        featured: Boolean(p.isFeatured),
        rating: Number(p.avgRating) || 5.0,
        ratingCount: p.ratingCount || 0,
        variants: variants.map((v) => ({
          id: v.id,
          label: v.variantLabel,
          price: Number(v.price) || 0,
          stock: v.stockQty ?? 0,
          sku: v.sku || "N/A",
        })),
        createdAt: p.createdAt,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Error fetching product" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleGetCategories(): Promise<Response> {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT DISTINCT 
        COALESCE(sc.name, pc.name, p.field, 'General') AS category_name,
        COUNT(p.id)::int as product_count
      FROM products p
      LEFT JOIN shop_categories sc ON p.category_id = sc.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.status = 'active' AND p.deleted_at IS NULL AND p.external_product_id IS NOT NULL
      GROUP BY category_name
      ORDER BY product_count DESC
    `;

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleGetProductsByIds(url: URL): Promise<Response> {
  try {
    const idsParam = url.searchParams.get("ids") || "";
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sql = getDb();
    const rows = await sql`
      SELECT 
        p.id, p.external_product_id, p.name, p.slug, p.description, 
        p.base_price, p.stock_qty, p.status, p.field, p.subcategory, 
        p.brand, p.seller, p.county, p.unit, p.image_urls, p.is_featured,
        p.avg_rating, p.rating_count, p.created_at,
        COALESCE(sc.name, pc.name, p.subcategory) AS category_name
      FROM products p
      LEFT JOIN shop_categories sc ON p.category_id = sc.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE (p.id::text = ANY(${ids}) OR p.external_product_id = ANY(${ids}) OR p.slug = ANY(${ids}))
        AND p.deleted_at IS NULL
    `;

    const items = rows.map((p: any) => {
      const imageUrl = resolveFastProductImage(p);
      return {
        id: p.id,
        name: p.name,
        price: Number(p.base_price) || 0,
        stock: p.stock_qty ?? 0,
        category: p.category_name || p.subcategory || p.field || "General",
        subcategory: p.subcategory || "",
        brand: p.brand && !/smooth\s*sale/i.test(p.brand) ? p.brand : "Verified Agrovet Partner",
        seller: p.seller || "Kirgit Agri Depot",
        county: p.county || "Kenya",
        unit: p.unit || "Unit",
        image: imageUrl,
        images: Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls : [imageUrl],
        rating: Number(p.avg_rating) || 5.0,
        ratingCount: p.rating_count || 0,
        featured: Boolean(p.is_featured),
        description: cleanDescriptionText(p.description) || "Genuine certified agricultural input for farm use.",
        createdAt: p.created_at,
      };
    });

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to fetch products" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

