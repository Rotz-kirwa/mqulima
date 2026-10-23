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
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "24", 10)));
    const offset = (page - 1) * limit;

    const sql = getDb();
    let whereClause = sql`p.status = 'active' AND p.deleted_at IS NULL`;

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
          COALESCE(sc.name, pc.name, p.subcategory) AS category_name
        FROM products p
        LEFT JOIN shop_categories sc ON p.category_id = sc.id
        LEFT JOIN shop_subcategories ss ON p.subcategory_id = ss.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE ${whereClause}
        ORDER BY p.is_featured DESC, (p.stock_qty > 0) DESC, p.created_at DESC
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

export async function handleFeaturedProducts(): Promise<Response> {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT p.*, COALESCE(sc.name, pc.name, p.subcategory) AS category_name
      FROM products p
      LEFT JOIN shop_categories sc ON p.category_id = sc.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.status = 'active' AND p.deleted_at IS NULL AND p.is_featured = true
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
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
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
        price: Number(p.base_price) || 0,
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
      WHERE p.status = 'active' AND p.deleted_at IS NULL
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
      WHERE p.id = ANY(${ids}) AND p.deleted_at IS NULL
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

