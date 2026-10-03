import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { type ShopProduct, mapToNewTaxonomy } from "../shop-data";

const ProductsInputSchema = z.object({
  category: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(1000)
});

import { resolveFastProductImage } from "./shop.server";

function mapDbProduct(p: any): ShopProduct {
  const tax = mapToNewTaxonomy(p);
  const resolvedCategory = p.category_name || p.old_category_name || tax.category || p.subcategory || p.field || "Farm Essentials";
  const resolvedSubcategory = p.subcategory_name || p.subcategory || tax.subcategory || "";

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description || "",
    briefDescription: p.brief_description || "",
    price: Number(p.base_price || 0),
    originalPrice: p.original_price ? Number(p.original_price) : null,
    stock: p.status === 'draft' ? (p.stock_qty || 0) : 9999,
    image: resolveFastProductImage(p),
    imageUrls: Array.isArray(p.image_urls) ? p.image_urls : [],
    category: resolvedCategory,
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
    field: p.field_name || p.field || "",
    subcategory: resolvedSubcategory,
    rating: Number(p.avg_rating || 0),
    reviewsCount: Number(p.rating_count || 0),
    isFeatured: !!p.is_featured
  };
}

export const getProducts = createServerFn({ method: "GET" })
  .inputValidator((val: unknown) => ProductsInputSchema.parse(val || {}))
  .handler(async ({ data }) => {
    const { category, page = 1, limit = 1000 } = data;
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

const featuredCache = { data: null as any, expiry: 0 };
const FEATURED_CACHE_TTL = 5 * 60 * 1000;

export function invalidateFeaturedCache() {
  featuredCache.data = null;
  featuredCache.expiry = 0;
}

export const getFeaturedProducts = createServerFn({ method: "GET" })
  .handler(async () => {
    const now = Date.now();
    if (featuredCache.data && featuredCache.expiry > now) {
      return featuredCache.data;
    }

    const { getDb } = await import("../db.server");
    const sql = getDb();

    // 1. Fetch active products marked as featured in products table
    let dbProducts: any[] = [];
    try {
      dbProducts = await sql`
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
        LIMIT 12
      `;
    } catch (e) {
      console.error("[getFeaturedProducts] Failed to query products table:", e);
    }

    const mappedProducts = dbProducts.map((p: any) => {
      const mapped = mapDbProduct(p);
      return {
        ...mapped,
        linkUrl: `/shop/product/${mapped.slug}`,
      };
    });

    // 2. Fetch curated items from featured_items table (managed via Admin FeaturedCollectionModule)
    let featItems: any[] = [];
    try {
      featItems = await sql`
        SELECT fi.id, fi.title, fi.image_url, fi.link_url, fi.position, fi.entity_type, fi.entity_id,
               p.id as prod_id, p.name as prod_name, p.slug as prod_slug, p.base_price, p.image_urls as prod_image_urls,
               p.category_id, p.field_id, p.subcategory_id, p.shop_type,
               COALESCE(sc.name, pc.name) AS category_name,
               sf.name AS field_name,
               ss.name AS subcategory_name
        FROM featured_items fi
        LEFT JOIN products p ON (
          (fi.entity_id IS NOT NULL AND fi.entity_id != 'custom' AND fi.entity_id = p.id::text)
          OR (p.slug IS NOT NULL AND fi.link_url LIKE '%' || p.slug)
        )
        LEFT JOIN shop_fields sf ON p.field_id = sf.id
        LEFT JOIN shop_categories sc ON p.category_id = sc.id
        LEFT JOIN shop_subcategories ss ON p.subcategory_id = ss.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        ORDER BY fi.position ASC
      `;
    } catch (e) {
      console.warn("[getFeaturedProducts] featured_items table query skipped or empty:", e);
    }

    // Map curated featured items enriched with product live data
    const customItems = featItems
      .filter((fi: any) => !fi.id?.startsWith("feat-seed-") || mappedProducts.length === 0)
      .map((fi: any) => {
        const slug = fi.prod_slug || (fi.link_url?.replace(/^.*\/shop\/product\//, "").replace(/\/$/, "") || "");
        const fallbackImg = fi.prod_name ? resolveFastProductImage({
          name: fi.prod_name,
          category_name: fi.category_name,
          subcategory_name: fi.subcategory_name,
          shop_type: fi.shop_type,
          image_urls: fi.prod_image_urls,
        }) : "/placeholder-product.png";

        const image = (fi.image_url && !fi.image_url.includes("default.png"))
          ? fi.image_url
          : fallbackImg;

        return {
          id: fi.id,
          name: fi.title || fi.prod_name || "Farm Essential",
          image,
          imageUrls: [image],
          linkUrl: fi.link_url || (slug ? `/shop/product/${slug}` : "/shop"),
          category: fi.category_name || "Farm Essentials",
          price: Number(fi.base_price || 0),
          slug,
          isFeatured: true,
        };
      });

    // Merge: custom curated items first, followed by active featured products
    const combined: any[] = [...customItems];
    for (const p of mappedProducts) {
      if (!combined.some((item) => (item.slug && item.slug === p.slug) || item.id === p.id)) {
        combined.push(p);
      }
    }

    // 3. Fallback: If no products marked featured, fetch latest active products
    if (combined.length === 0) {
      try {
        const fallbackProducts = await sql`
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
          ORDER BY p.created_at DESC
          LIMIT 8
        `;
        const fallbackMapped = fallbackProducts.map((p: any) => {
          const mapped = mapDbProduct(p);
          return {
            ...mapped,
            linkUrl: `/shop/product/${mapped.slug}`,
          };
        });
        combined.push(...fallbackMapped);
      } catch (e) {
        console.error("[getFeaturedProducts] Fallback catalog query error:", e);
      }
    }

    featuredCache.data = combined;
    featuredCache.expiry = now + FEATURED_CACHE_TTL;
    return combined;
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
