// ============================================================================
// product-catalog.server.ts — Authoritative PostgreSQL Catalog Search for AI
// ============================================================================

export interface ProductCatalogSearchParams {
  query?: string;
  category?: string;
  crop?: string;
  problem?: string;
  activeOnly?: boolean;
  inStockOnly?: boolean;
  limit?: number;
}

export interface CatalogProductResult {
  productId: string;
  slug: string;
  name: string;
  price: number;
  stockQty: number;
  inStock: boolean;
  category: string;
  imageUrl: string;
  description: string;
}

/**
 * Authoritative server-side catalog query.
 * AI models MUST NOT invent products, prices, or availability.
 * All recommendation cards must ground directly in rows returned by this function.
 */
export async function searchProductsCatalog(params: ProductCatalogSearchParams): Promise<CatalogProductResult[]> {
  const { getDb } = await import("../db.server");
  const sql = getDb();

  const limit = Math.min(Math.max(params.limit || 4, 1), 10);
  const rawTerms = [params.query, params.category, params.crop, params.problem]
    .filter((t): t is string => typeof t === "string" && t.trim().length > 1);

  if (rawTerms.length === 0) {
    return [];
  }

  // Tokenize terms into distinct search tokens
  const tokens = Array.from(
    new Set(
      rawTerms
        .flatMap(t => t.toLowerCase().split(/[\s,+/]+/))
        .map(t => t.trim())
        .filter(t => t.length > 2)
    )
  ).slice(0, 8);

  if (tokens.length === 0) {
    return [];
  }

  const likeClauses = tokens.map(t => `%${t}%`);

  const rows = await sql`
    SELECT 
      p.id, 
      p.name, 
      p.slug, 
      p.base_price::float as price, 
      p.stock_qty, 
      p.image_urls, 
      p.description,
      COALESCE(sc.name, pc.name, p.subcategory, 'Agrochemicals') AS category_name
    FROM products p
    LEFT JOIN shop_categories sc ON p.category_id = sc.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE p.status = 'active'
      AND p.deleted_at IS NULL
      ${params.inStockOnly !== false ? sql`AND p.stock_qty > 0` : sql``}
      AND (
        p.name ILIKE ANY(${likeClauses})
        OR p.brand ILIKE ANY(${likeClauses})
        OR p.description ILIKE ANY(${likeClauses})
        OR p.subcategory ILIKE ANY(${likeClauses})
      )
    ORDER BY p.is_featured DESC, p.stock_qty DESC
    LIMIT ${limit}
  `;

  return rows.map((r: any) => ({
    productId: r.id,
    slug: r.slug,
    name: r.name,
    price: Number(r.price || 0),
    stockQty: Number(r.stock_qty || 0),
    inStock: Number(r.stock_qty || 0) > 0,
    category: r.category_name,
    imageUrl: (Array.isArray(r.image_urls) && r.image_urls[0]) || "/placeholder-product.png",
    description: r.description || "",
  }));
}
