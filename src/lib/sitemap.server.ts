import { getDb } from "./db.server";

export const CANONICAL_ORIGIN = "https://mqulima.com";

export interface SitemapRoute {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
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
 * Returns a fallback sitemap with all static canonical routes if the database is unreachable.
 */
export function getFallbackSitemapXml(): string {
  return buildSitemapXmlString(STATIC_PUBLIC_ROUTES);
}

/**
 * Generates the complete, production-ready XML sitemap including:
 * 1. Verified canonical static routes
 * 2. Published agritech news & blog articles (/blog/$slug)
 * 3. Active AgroShop certified marketplace products (/shop/product/$slug)
 */
export async function generateSitemapXml(): Promise<string> {
  const allRoutes: SitemapRoute[] = [...STATIC_PUBLIC_ROUTES];

  try {
    const sql = getDb();

    // 1. Dynamic Published Agritech News & Blog Articles
    try {
      const newsRows = await sql`
        SELECT slug, published_at, created_at
        FROM agritech_news
        WHERE (status = 'published' OR status::text ILIKE 'published')
          AND slug IS NOT NULL
          AND TRIM(slug) != ''
        ORDER BY published_at DESC NULLS LAST
        LIMIT 1000
      `;

      for (const row of newsRows) {
        const cleanSlug = String(row.slug).trim();
        const lastmod = formatLastmodDate(row.published_at || row.created_at);

        allRoutes.push({
          path: `/blog/${cleanSlug}`,
          lastmod,
          changefreq: "weekly",
          priority: "0.8",
        });
      }
    } catch (newsErr) {
      console.error("[SITEMAP] Failed to fetch agritech_news records:", newsErr);
    }

    // 2. Dynamic Active Certified Marketplace Products
    try {
      const productRows = await sql`
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

      for (const row of productRows) {
        const cleanSlug = String(row.slug).trim();
        const lastmod = formatLastmodDate(row.updated_at || row.created_at);

        allRoutes.push({
          path: `/shop/product/${cleanSlug}`,
          lastmod,
          changefreq: "weekly",
          priority: "0.8",
        });
      }
    } catch (prodErr) {
      console.error("[SITEMAP] Failed to fetch products records:", prodErr);
    }
  } catch (dbErr) {
    console.error("[SITEMAP] Database connection failed while generating sitemap:", dbErr);
  }

  return buildSitemapXmlString(allRoutes);
}
