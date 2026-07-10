import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { type ShopProduct } from "../shop-data";

const ProductsInputSchema = z.object({
  category: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(20)
});

function mapDbProduct(p: any): ShopProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description || "",
    briefDescription: p.brief_description || "",
    price: Number(p.base_price || 0),
    originalPrice: p.original_price ? Number(p.original_price) : null,
    stock: p.status === 'draft' ? (p.stock_qty || 0) : 9999,
    image: (Array.isArray(p.image_urls) && p.image_urls.length > 0) ? p.image_urls[0] : "/placeholder-product.png",
    imageUrls: Array.isArray(p.image_urls) ? p.image_urls : [],
    category: p.category_name || p.old_category_name || "",
    badge: p.badge || "",
    brand: p.brand || "",
    seller: p.seller || "",
    county: p.county || "",
    organic: !!p.organic,
    verifiedSeller: !!p.verified_seller,
    unit: p.unit || "/unit",
    sellerScore: p.seller_score || 0,
    condition: p.condition || "Fresh",
    shopType: p.shop_type === "agrovet" ? "Agrovet" : (p.shop_type === "specialist" ? "Specialist Shop" : "For Retailers"),
    field: p.field_name || "",
    subcategory: p.subcategory_name || p.subcategory || "",
    rating: Number(p.avg_rating || 0),
    reviewsCount: Number(p.rating_count || 0),
    isFeatured: !!p.is_featured
  };
}

export const getProducts = createServerFn({ method: "GET" })
  .inputValidator((val: unknown) => ProductsInputSchema.parse(val || {}))
  .handler(async ({ data }) => {
    const { category, page = 1, limit = 20 } = data;
    const { getDb } = await import("../db.server");
    const sql = getDb();

    const offset = (page - 1) * limit;

    let products;
    let totalCountRes;

    if (category) {
      products = await sql`
        SELECT p.*,
               COALESCE(sc.name, pc.name) AS category_name,
               sf.name AS field_name,
               ss.name AS subcategory_name
        FROM products p
        LEFT JOIN shop_fields sf ON p.field_id = sf.id
        LEFT JOIN shop_categories sc ON p.category_id = sc.id
        LEFT JOIN shop_subcategories ss ON p.subcategory_id = ss.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE p.status = 'active'
          AND COALESCE(sc.name, pc.name) = ${category}
          AND p.deleted_at IS NULL
        ORDER BY p.is_featured DESC, p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      totalCountRes = await sql`
        SELECT COUNT(*) as count
        FROM products p
        LEFT JOIN shop_categories sc ON p.category_id = sc.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE p.status = 'active'
          AND COALESCE(sc.name, pc.name) = ${category}
          AND p.deleted_at IS NULL
      `;
    } else {
      products = await sql`
        SELECT p.*,
               COALESCE(sc.name, pc.name) AS category_name,
               sf.name AS field_name,
               ss.name AS subcategory_name
        FROM products p
        LEFT JOIN shop_fields sf ON p.field_id = sf.id
        LEFT JOIN shop_categories sc ON p.category_id = sc.id
        LEFT JOIN shop_subcategories ss ON p.subcategory_id = ss.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE p.status = 'active' AND p.deleted_at IS NULL
        ORDER BY p.is_featured DESC, p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      totalCountRes = await sql`
        SELECT COUNT(*) as count
        FROM products p
        WHERE p.status = 'active' AND p.deleted_at IS NULL
      `;
    }

    const total = parseInt(totalCountRes[0]?.count || "0");
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      products: products.map(mapDbProduct),
      total,
      page,
      totalPages
    };
  });

export const getFeaturedProducts = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getDb } = await import("../db.server");
    const sql = getDb();

    const products = await sql`
      SELECT p.*,
             COALESCE(sc.name, pc.name) AS category_name,
             sf.name AS field_name,
             ss.name AS subcategory_name
      FROM products p
      LEFT JOIN shop_fields sf ON p.field_id = sf.id
      LEFT JOIN shop_categories sc ON p.category_id = sc.id
      LEFT JOIN shop_subcategories ss ON p.subcategory_id = ss.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.status = 'active' AND p.is_featured = true AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC
      LIMIT 8
    `;

    return products.map(mapDbProduct);
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .handler(async ({ data: identifier }) => {
    const { getDb } = await import("../db.server");
    const sql = getDb();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);

    const productRes = isUuid
      ? await sql`
          SELECT p.*,
                 COALESCE(sc.name, pc.name) AS category_name,
                 sf.name AS field_name,
                 ss.name AS subcategory_name
          FROM products p
          LEFT JOIN shop_fields sf ON p.field_id = sf.id
          LEFT JOIN shop_categories sc ON p.category_id = sc.id
          LEFT JOIN shop_subcategories ss ON p.subcategory_id = ss.id
          LEFT JOIN product_categories pc ON p.category_id = pc.id
          WHERE (p.id = ${identifier} OR p.slug = ${identifier})
            AND p.status = 'active'
            AND p.deleted_at IS NULL
          LIMIT 1
        `
      : await sql`
          SELECT p.*,
                 COALESCE(sc.name, pc.name) AS category_name,
                 sf.name AS field_name,
                 ss.name AS subcategory_name
          FROM products p
          LEFT JOIN shop_fields sf ON p.field_id = sf.id
          LEFT JOIN shop_categories sc ON p.category_id = sc.id
          LEFT JOIN shop_subcategories ss ON p.subcategory_id = ss.id
          LEFT JOIN product_categories pc ON p.category_id = pc.id
          WHERE p.slug = ${identifier}
            AND p.status = 'active'
            AND p.deleted_at IS NULL
          LIMIT 1
        `;

    if (productRes.length === 0) {
      throw new Error("Product not found");
    }

    const p = productRes[0];
    const product = mapDbProduct(p);

    const reviews = await sql`
      SELECT pr.*, prof.full_name as author_name
      FROM product_reviews pr
      JOIN profiles prof ON pr.user_id = prof.id
      WHERE pr.product_id = ${p.id}
      ORDER BY pr.created_at DESC
      LIMIT 10
    `;

    return {
      product,
      reviews: reviews.map((r: any) => ({
        id: r.id,
        name: r.author_name || "Anonymous Farmer",
        rating: r.rating,
        text: r.comment || "",
        date: new Date(r.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      }))
    };
  });

export const searchProducts = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .handler(async ({ data: query }) => {
    const { getDb } = await import("../db.server");
    const sql = getDb();

    if (!query || !query.trim()) {
      return [];
    }

    const products = await sql`
      SELECT p.*,
             COALESCE(sc.name, pc.name) AS category_name,
             sf.name AS field_name,
             ss.name AS subcategory_name
      FROM products p
      LEFT JOIN shop_fields sf ON p.field_id = sf.id
      LEFT JOIN shop_categories sc ON p.category_id = sc.id
      LEFT JOIN shop_subcategories ss ON p.subcategory_id = ss.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.search_vector @@ plainto_tsquery('english', ${query})
        AND p.status = 'active'
        AND p.deleted_at IS NULL
      ORDER BY ts_rank(p.search_vector, plainto_tsquery('english', ${query})) DESC
      LIMIT 20
    `;

    return products.map(mapDbProduct);
  });
