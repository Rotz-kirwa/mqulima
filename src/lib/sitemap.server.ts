import { getDb } from "./db.server";

export async function generateSitemapXml(): Promise<string> {
  const baseUrl = "https://www.mqulima.com";
  const now = new Date().toISOString().split("T")[0];

  const staticRoutes = [
    { path: "/", priority: "1.0", changefreq: "daily", lastmod: now },
    { path: "/shop", priority: "0.9", changefreq: "daily", lastmod: now },
    { path: "/blog", priority: "0.9", changefreq: "daily", lastmod: now },
    { path: "/services", priority: "0.8", changefreq: "weekly", lastmod: now },
    { path: "/tools", priority: "0.8", changefreq: "weekly", lastmod: now },
    { path: "/community", priority: "0.7", changefreq: "daily", lastmod: now },
    { path: "/ai", priority: "0.7", changefreq: "weekly", lastmod: now },
    { path: "/about", priority: "0.6", changefreq: "monthly", lastmod: now },
    { path: "/contact", priority: "0.6", changefreq: "monthly", lastmod: now },
    { path: "/terms", priority: "0.4", changefreq: "monthly", lastmod: now },
  ];

  let blogUrls: Array<{ path: string; lastmod: string; priority: string; changefreq: string }> = [];
  let productUrls: Array<{ path: string; lastmod: string; priority: string; changefreq: string }> = [];

  try {
    const sql = getDb();

    // Fetch published blog / agritech news posts
    const newsRows = await sql`
      SELECT slug, published_at, created_at
      FROM agritech_news
      WHERE LOWER(status) = 'published' AND slug IS NOT NULL AND slug != ''
      ORDER BY published_at DESC NULLS LAST
      LIMIT 500
    `;

    blogUrls = newsRows.map((row) => {
      const dateVal = row.published_at || row.created_at;
      const lastmod = dateVal ? new Date(dateVal as string).toISOString().split("T")[0] : now;
      return {
        path: `/blog/${row.slug}`,
        lastmod,
        priority: "0.8",
        changefreq: "weekly",
      };
    });

    // Fetch active shop products
    const productRows = await sql`
      SELECT id, slug, updated_at, created_at
      FROM products
      WHERE (LOWER(status) = 'active' OR status IS NULL)
      ORDER BY created_at DESC
      LIMIT 500
    `;

    productUrls = productRows.map((row) => {
      const slugOrId = row.slug || row.id;
      const dateVal = row.updated_at || row.created_at;
      const lastmod = dateVal ? new Date(dateVal as string).toISOString().split("T")[0] : now;
      return {
        path: `/shop/product/${slugOrId}`,
        lastmod,
        priority: "0.8",
        changefreq: "weekly",
      };
    });
  } catch (err) {
    console.error("[SITEMAP] Failed to fetch dynamic database items for sitemap:", err);
  }

  const allUrls = [...staticRoutes, ...blogUrls, ...productUrls];

  const urlElements = allUrls
    .map((item) => {
      return `  <url>
    <loc>${baseUrl}${item.path}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}
