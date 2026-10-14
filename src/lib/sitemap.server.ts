import { getDb } from "./db.server";

export const CANONICAL_ORIGIN = "https://mqulima.com";

export interface SitemapRoute {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
}

export interface SitemapCacheEntry {
  xml: string;
  generatedAt: number;
  durationMs: number;
  itemCount: number;
}

export class SitemapGenerationError extends Error {
  public readonly isSitemapError = true;
  public readonly code: string;
  public readonly cause?: unknown;

  constructor(message: string, code = "DATABASE_UNAVAILABLE", cause?: unknown) {
    super(message);
    this.name = "SitemapGenerationError";
    this.code = code;
    this.cause = cause;
  }
}

/**
 * Escapes characters that are reserved or invalid in XML.
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Safely parses and formats a date to W3C sitemap format (YYYY-MM-DD).
 * Returns undefined if date is null, undefined, or invalid.
 */
export function formatLastmodDate(dateValue: unknown): string | undefined {
  if (!dateValue) return undefined;
  try {
    const d = new Date(dateValue as string | number | Date);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().split("T")[0];
  } catch {
    return undefined;
  }
}

/**
 * Primary public canonical routes for Mqulima.
 * Excludes:
 * - /admin/* (Administrative portal)
 * - /dashboard/* (Private farmer dashboard)
 * - /auth/* and /login (Authentication pages)
 * - /news (301/302 redirect to /blog)
 * - /shop/$productId (Redirect to /shop/product/$slug)
 * - /payments/* (Callback & transaction flows)
 * - /api/* (API endpoints)
 * 
 * Note: lastmod is intentionally omitted for static pages to avoid fabricating arbitrary dates.
 */
export const STATIC_PUBLIC_ROUTES: SitemapRoute[] = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/shop", priority: "0.9", changefreq: "daily" },
  { path: "/blog", priority: "0.9", changefreq: "daily" },
  { path: "/services", priority: "0.8", changefreq: "weekly" },
  { path: "/tools", priority: "0.8", changefreq: "weekly" },
  { path: "/academy", priority: "0.8", changefreq: "weekly" },
  { path: "/community", priority: "0.7", changefreq: "daily" },
  { path: "/ai", priority: "0.7", changefreq: "weekly" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.6", changefreq: "monthly" },
  { path: "/terms", priority: "0.4", changefreq: "monthly" },
];

/**
 * Builds XML markup from a list of SitemapRoute items.
 */
export function buildSitemapXmlString(routes: SitemapRoute[]): string {
  // Deduplicate by canonical URL
  const uniqueUrls = new Map<string, SitemapRoute>();

  for (const route of routes) {
    const normalizedPath = route.path.startsWith("/") ? route.path : `/${route.path}`;
    const fullLoc = normalizedPath === "/" ? `${CANONICAL_ORIGIN}/` : `${CANONICAL_ORIGIN}${normalizedPath}`;
    
    if (!uniqueUrls.has(fullLoc)) {
      uniqueUrls.set(fullLoc, route);
    }
  }

  const urlBlocks: string[] = [];

  for (const [loc, route] of uniqueUrls.entries()) {
    const lines = [`  <url>`, `    <loc>${escapeXml(loc)}</loc>`];

    if (route.lastmod) {
      lines.push(`    <lastmod>${route.lastmod}</lastmod>`);
    }

    if (route.changefreq) {
      lines.push(`    <changefreq>${route.changefreq}</changefreq>`);
    }

    if (route.priority) {
      lines.push(`    <priority>${route.priority}</priority>`);
    }

    lines.push(`  </url>`);
    urlBlocks.push(lines.join("\n"));
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlBlocks.join("\n")}
</urlset>`;
}

/**
 * Builds XML markup for a sitemap index file (<sitemapindex>).
 */
export function buildSitemapIndexXmlString(sitemaps: Array<{ loc: string; lastmod?: string }>): string {
  const blocks: string[] = [];

  for (const item of sitemaps) {
    const lines = [`  <sitemap>`, `    <loc>${escapeXml(item.loc)}</loc>`];
    if (item.lastmod) {
      lines.push(`    <lastmod>${escapeXml(item.lastmod)}</lastmod>`);
    }
    lines.push(`  </sitemap>`);
    blocks.push(lines.join("\n"));
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${blocks.join("\n")}
</sitemapindex>`;
}

/**
 * Returns a fallback sitemap with all static canonical routes.
 */
export function getFallbackSitemapXml(): string {
  return buildSitemapXmlString(STATIC_PUBLIC_ROUTES);
}

// In-Memory Stale-While-Revalidate (SWR) Cache
// Fresh TTL: 1 hour (3,600,000 ms) | Stale TTL: 24 hours (86,400,000 ms)
const CACHE_FRESH_MS = 60 * 60 * 1000;
const CACHE_STALE_MS = 24 * 60 * 60 * 1000;
const QUERY_TIMEOUT_MS = 6000;

interface CacheStore {
  full?: SitemapCacheEntry;
  pages?: SitemapCacheEntry;
  products?: SitemapCacheEntry;
  blog?: SitemapCacheEntry;
}

const sitemapCache: CacheStore = {};

export function clearSitemapCache(): void {
  delete sitemapCache.full;
  delete sitemapCache.pages;
  delete sitemapCache.products;
  delete sitemapCache.blog;
}

export function getSitemapMetrics(): {
  cachedKeys: string[];
  fullCachedAgeMs?: number;
  fullItemCount?: number;
} {
  const now = Date.now();
  return {
    cachedKeys: Object.keys(sitemapCache),
    fullCachedAgeMs: sitemapCache.full ? now - sitemapCache.full.generatedAt : undefined,
    fullItemCount: sitemapCache.full ? sitemapCache.full.itemCount : undefined,
  };
}

/**
 * Enforces a strict execution deadline on database queries to prevent indefinite hangs.
 */
async function withQueryTimeout<T>(promise: Promise<T>, timeoutMs = QUERY_TIMEOUT_MS, label = "Query"): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new SitemapGenerationError(`${label} timed out after ${timeoutMs}ms`, "QUERY_TIMEOUT"));
    }, timeoutMs);
    timer?.unref?.();
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Fetch published Agritech news and blog routes from database with timeout.
 */
async function fetchNewsRoutes(): Promise<SitemapRoute[]> {
  const sql = getDb();
  const query = sql`
    SELECT slug, published_at, created_at
    FROM agritech_news
    WHERE (status = 'published' OR status::text ILIKE 'published')
      AND slug IS NOT NULL
      AND TRIM(slug) != ''
    ORDER BY published_at DESC NULLS LAST
    LIMIT 1000
  `;

  const rows = await withQueryTimeout(query, QUERY_TIMEOUT_MS, "Agritech news query");
  const routes: SitemapRoute[] = [];

  for (const row of rows) {
    const cleanSlug = String(row.slug).trim();
    if (!cleanSlug) continue;
    routes.push({
      path: `/blog/${cleanSlug}`,
      lastmod: formatLastmodDate(row.published_at || row.created_at),
      changefreq: "weekly",
      priority: "0.8",
    });
  }

  return routes;
}

/**
 * Fetch active certified marketplace product routes from database with timeout.
 */
async function fetchProductRoutes(): Promise<SitemapRoute[]> {
  const sql = getDb();
  const query = sql`
    SELECT id, slug, updated_at, created_at
    FROM products
    WHERE (status = 'active' OR status IS NULL)
      AND deleted_at IS NULL
      AND external_product_id IS NOT NULL
      AND slug IS NOT NULL
      AND TRIM(slug) != ''
    ORDER BY updated_at DESC NULLS LAST, created_at DESC
    LIMIT 1000
  `;

  const rows = await withQueryTimeout(query, QUERY_TIMEOUT_MS, "Products query");
  const routes: SitemapRoute[] = [];

  for (const row of rows) {
    const cleanSlug = String(row.slug).trim();
    if (!cleanSlug) continue;
    routes.push({
      path: `/shop/product/${cleanSlug}`,
      lastmod: formatLastmodDate(row.updated_at || row.created_at),
      changefreq: "weekly",
      priority: "0.8",
    });
  }

  return routes;
}

/**
 * Generates the XML sitemap for static public pages.
 */
export function generateSitemapPagesXml(): string {
  const now = Date.now();
  if (sitemapCache.pages && now - sitemapCache.pages.generatedAt < CACHE_FRESH_MS) {
    return sitemapCache.pages.xml;
  }

  const xml = buildSitemapXmlString(STATIC_PUBLIC_ROUTES);
  sitemapCache.pages = {
    xml,
    generatedAt: now,
    durationMs: 0,
    itemCount: STATIC_PUBLIC_ROUTES.length,
  };
  return xml;
}

/**
 * Generates the XML sitemap for published blog and agritech news articles.
 */
export async function generateSitemapBlogXml(): Promise<string> {
  const now = Date.now();
  if (sitemapCache.blog && now - sitemapCache.blog.generatedAt < CACHE_FRESH_MS) {
    return sitemapCache.blog.xml;
  }

  const start = performance.now();
  try {
    const routes = await fetchNewsRoutes();
    const xml = buildSitemapXmlString(routes);
    const durationMs = Math.round(performance.now() - start);

    sitemapCache.blog = {
      xml,
      generatedAt: now,
      durationMs,
      itemCount: routes.length,
    };
    return xml;
  } catch (err) {
    // If stale cache exists within 24h, return stale cache
    if (sitemapCache.blog && now - sitemapCache.blog.generatedAt < CACHE_STALE_MS) {
      console.warn("[SITEMAP] Blog DB query failed, returning stale cache:", (err as any)?.message);
      return sitemapCache.blog.xml;
    }
    throw new SitemapGenerationError(
      `Failed to generate blog sitemap: ${(err as any)?.message || "Database unavailable"}`,
      "DATABASE_UNAVAILABLE",
      err
    );
  }
}

/**
 * Generates the XML sitemap for active marketplace products.
 */
export async function generateSitemapProductsXml(): Promise<string> {
  const now = Date.now();
  if (sitemapCache.products && now - sitemapCache.products.generatedAt < CACHE_FRESH_MS) {
    return sitemapCache.products.xml;
  }

  const start = performance.now();
  try {
    const routes = await fetchProductRoutes();
    const xml = buildSitemapXmlString(routes);
    const durationMs = Math.round(performance.now() - start);

    sitemapCache.products = {
      xml,
      generatedAt: now,
      durationMs,
      itemCount: routes.length,
    };
    return xml;
  } catch (err) {
    // If stale cache exists within 24h, return stale cache
    if (sitemapCache.products && now - sitemapCache.products.generatedAt < CACHE_STALE_MS) {
      console.warn("[SITEMAP] Product DB query failed, returning stale cache:", (err as any)?.message);
      return sitemapCache.products.xml;
    }
    throw new SitemapGenerationError(
      `Failed to generate products sitemap: ${(err as any)?.message || "Database unavailable"}`,
      "DATABASE_UNAVAILABLE",
      err
    );
  }
}

/**
 * Generates the complete canonical XML sitemap including:
 * 1. Verified canonical static routes
 * 2. Published agritech news & blog articles (/blog/$slug)
 * 3. Active AgroShop certified marketplace products (/shop/product/$slug)
 *
 * Employs Stale-While-Revalidate in-memory caching and strict query timeouts.
 * Throws SitemapGenerationError on unrecoverable DB failures to prevent incomplete 200 OK responses.
 */
export async function generateSitemapXml(): Promise<string> {
  const now = Date.now();

  // 1. Fast Cache Hit (< 2ms)
  if (sitemapCache.full && now - sitemapCache.full.generatedAt < CACHE_FRESH_MS) {
    return sitemapCache.full.xml;
  }

  const genStart = performance.now();

  try {
    // 2. Parallel Database Queries with Timeout
    const [newsRoutes, productRoutes] = await Promise.all([
      fetchNewsRoutes(),
      fetchProductRoutes(),
    ]);

    const allRoutes: SitemapRoute[] = [
      ...STATIC_PUBLIC_ROUTES,
      ...newsRoutes,
      ...productRoutes,
    ];

    const xml = buildSitemapXmlString(allRoutes);
    const durationMs = Math.round(performance.now() - genStart);

    sitemapCache.full = {
      xml,
      generatedAt: now,
      durationMs,
      itemCount: allRoutes.length,
    };

    console.info(`[SITEMAP] Generated complete sitemap in ${durationMs}ms (${allRoutes.length} URLs).`);
    return xml;
  } catch (err) {
    // 3. Stale Cache Fallback (Preserve existing crawler indexes)
    if (sitemapCache.full && now - sitemapCache.full.generatedAt < CACHE_STALE_MS) {
      console.warn(
        `[SITEMAP] Database query failed (${(err as any)?.message}), serving stale sitemap generated ${Math.round(
          (now - sitemapCache.full.generatedAt) / 1000
        )}s ago.`
      );
      return sitemapCache.full.xml;
    }

    // 4. Explicit Failure: Never return an incomplete 200 OK fallback that causes search engines to de-index products
    console.error("[SITEMAP] Critical failure generating complete sitemap:", err);
    throw new SitemapGenerationError(
      `Database unavailable for sitemap generation: ${(err as any)?.message || "Unknown error"}`,
      "DATABASE_UNAVAILABLE",
      err
    );
  }
}

/**
 * Generates the root sitemap index XML linking the partitioned sitemaps.
 */
export function generateSitemapIndexXml(): string {
  const today = new Date().toISOString().split("T")[0];
  const sitemaps = [
    { loc: `${CANONICAL_ORIGIN}/sitemap-pages.xml`, lastmod: today },
    { loc: `${CANONICAL_ORIGIN}/sitemap-products.xml`, lastmod: today },
    { loc: `${CANONICAL_ORIGIN}/sitemap-blog.xml`, lastmod: today },
  ];
  return buildSitemapIndexXmlString(sitemaps);
}
