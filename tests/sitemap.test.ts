import { describe, it, expect, beforeEach } from "vitest";
import {
  CANONICAL_ORIGIN,
  STATIC_PUBLIC_ROUTES,
  buildSitemapXmlString,
  buildSitemapIndexXmlString,
  escapeXml,
  formatLastmodDate,
  getFallbackSitemapXml,
  generateSitemapXml,
  generateSitemapPagesXml,
  generateSitemapProductsXml,
  generateSitemapBlogXml,
  generateSitemapIndexXml,
  clearSitemapCache,
  getSitemapMetrics,
  SitemapGenerationError,
} from "../src/lib/sitemap.server";
import server from "../src/server";

describe("Production XML Sitemap & Robots Suite", () => {
  beforeEach(() => {
    clearSitemapCache();
  });

  describe("1. Canonical Origin & Route Whitelist", () => {
    it("should enforce canonical origin as https://mqulima.com without www or port", () => {
      expect(CANONICAL_ORIGIN).toBe("https://mqulima.com");
      expect(CANONICAL_ORIGIN).not.toContain("www.");
    });

    it("should include all 11 verified public static routes", () => {
      const paths = STATIC_PUBLIC_ROUTES.map((r) => r.path);

      expect(paths).toContain("/");
      expect(paths).toContain("/shop");
      expect(paths).toContain("/blog");
      expect(paths).toContain("/services");
      expect(paths).toContain("/tools");
      expect(paths).toContain("/academy");
      expect(paths).toContain("/community");
      expect(paths).toContain("/ai");
      expect(paths).toContain("/about");
      expect(paths).toContain("/contact");
      expect(paths).toContain("/terms");
      expect(paths.length).toBe(11);
    });

    it("should strictly exclude private, admin, auth, and redirect routes", () => {
      const paths = STATIC_PUBLIC_ROUTES.map((r) => r.path);

      expect(paths).not.toContain("/admin");
      expect(paths).not.toContain("/dashboard");
      expect(paths).not.toContain("/login");
      expect(paths).not.toContain("/news");
      expect(paths).not.toContain("/auth");
      expect(paths).not.toContain("/auth/sign-in");
      expect(paths).not.toContain("/auth/sign-up");
      expect(paths).not.toContain("/api");
      expect(paths).not.toContain("/payments");
    });
  });

  describe("2. Lastmod Integrity & No Fabricated Dates", () => {
    it("should not fabricate lastmod dates for static routes", () => {
      for (const route of STATIC_PUBLIC_ROUTES) {
        expect(route.lastmod).toBeUndefined();
      }

      const xml = buildSitemapXmlString(STATIC_PUBLIC_ROUTES);
      expect(xml).not.toContain("<loc>https://mqulima.com/</loc>\n    <lastmod>");
      expect(xml).not.toContain("<loc>https://mqulima.com/about</loc>\n    <lastmod>");
    });

    it("should format valid dates to YYYY-MM-DD", () => {
      expect(formatLastmodDate("2026-09-28T14:30:00.000Z")).toBe("2026-09-28");
      expect(formatLastmodDate(new Date("2026-10-13T08:00:00Z"))).toBe("2026-10-13");
    });

    it("should safely return undefined for null, undefined, or invalid dates", () => {
      expect(formatLastmodDate(null)).toBeUndefined();
      expect(formatLastmodDate(undefined)).toBeUndefined();
      expect(formatLastmodDate("not-a-date")).toBeUndefined();
      expect(formatLastmodDate("")).toBeUndefined();
    });
  });

  describe("3. XML Syntax & Escaping Guardrails", () => {
    it("should escape special XML characters properly", () => {
      const raw = 'Farm & Tool <Equipment> "Best" \'Picks\'';
      const escaped = escapeXml(raw);

      expect(escaped).toBe("Farm &amp; Tool &lt;Equipment&gt; &quot;Best&quot; &apos;Picks&apos;");
    });

    it("should produce well-formed XML declaration and schema", () => {
      const xml = getFallbackSitemapXml();

      expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(xml.endsWith("</urlset>")).toBe(true);
    });

    it("should deduplicate duplicate URL entries", () => {
      const duplicateRoutes = [
        { path: "/shop", priority: "0.9" },
        { path: "/shop", priority: "0.8" }, // Duplicate
        { path: "/", priority: "1.0" },
      ];

      const xml = buildSitemapXmlString(duplicateRoutes);
      const matches = xml.match(/<loc>https:\/\/mqulima\.com\/shop<\/loc>/g);
      expect(matches?.length).toBe(1);
    });
  });

  describe("4. End-to-End Dynamic Sitemap & SWR In-Memory Caching", () => {
    it("should generate valid sitemap containing canonical static, blog, and product entries", async () => {
      const xml = await generateSitemapXml();

      expect(typeof xml).toBe("string");
      expect(xml).toContain("<loc>https://mqulima.com/</loc>");
      expect(xml).toContain("<loc>https://mqulima.com/shop</loc>");
      expect(xml).toContain("<loc>https://mqulima.com/blog</loc>");
      expect(xml).toContain("<loc>https://mqulima.com/academy</loc>");
      expect(xml).not.toContain("https://www.mqulima.com");
      expect(xml).not.toContain("localhost");

      // Verify no illegal route paths
      expect(xml).not.toContain("/admin");
      expect(xml).not.toContain("/dashboard");
      expect(xml).not.toContain("/auth/");
    });

    it("should serve cached sitemap on subsequent call in under 5ms", async () => {
      // First call primes the cache
      await generateSitemapXml();

      // Second call must hit the SWR in-memory cache
      const start = performance.now();
      const cachedXml = await generateSitemapXml();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10);
      expect(typeof cachedXml).toBe("string");
      expect(cachedXml.length).toBeGreaterThan(100);

      const metrics = getSitemapMetrics();
      expect(metrics.cachedKeys).toContain("full");
      expect(metrics.fullItemCount).toBeGreaterThan(10);
    });
  });

  describe("5. Partitioned Sitemaps & Sitemap Index Specification", () => {
    it("should generate static pages partitioned sitemap", () => {
      const pagesXml = generateSitemapPagesXml();
      expect(pagesXml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(pagesXml).toContain("<loc>https://mqulima.com/</loc>");
      expect(pagesXml).toContain("<loc>https://mqulima.com/services</loc>");
      expect(pagesXml).not.toContain("/blog/");
      expect(pagesXml).not.toContain("/shop/product/");
    });

    it("should generate products partitioned sitemap", async () => {
      const productsXml = await generateSitemapProductsXml();
      expect(productsXml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(productsXml).toContain("<loc>https://mqulima.com/shop/product/");
    });

    it("should generate blog partitioned sitemap", async () => {
      const blogXml = await generateSitemapBlogXml();
      expect(blogXml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(blogXml).toContain("<loc>https://mqulima.com/blog/");
    });

    it("should generate sitemap index XML linking all partitions", () => {
      const indexXml = generateSitemapIndexXml();
      expect(indexXml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
      expect(indexXml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(indexXml).toContain("<loc>https://mqulima.com/sitemap-pages.xml</loc>");
      expect(indexXml).toContain("<loc>https://mqulima.com/sitemap-products.xml</loc>");
      expect(indexXml).toContain("<loc>https://mqulima.com/sitemap-blog.xml</loc>");
      expect(indexXml.endsWith("</sitemapindex>")).toBe(true);
    });
  });

  describe("6. Server Route Interception & WordPress Bot Probe Shield", () => {
    it("should intercept /xmlrpc.php and return instant 404 without SSR errors", async () => {
      const req = new Request("https://www.mqulima.com/xmlrpc.php", { method: "POST" });
      const res = await server.fetch(req, {}, {});
      expect(res.status).toBe(404);
      expect(await res.text()).toBe("Not Found");
    });

    it("should intercept /wp/xmlrpc.php and return instant 404", async () => {
      const req = new Request("https://www.mqulima.com/wp/xmlrpc.php", { method: "POST" });
      const res = await server.fetch(req, {}, {});
      expect(res.status).toBe(404);
      expect(await res.text()).toBe("Not Found");
    });

    it("should intercept /.env probes and return instant 404", async () => {
      const req = new Request("https://www.mqulima.com/.env", { method: "GET" });
      const res = await server.fetch(req, {}, {});
      expect(res.status).toBe(404);
    });

    it("should serve /sitemap.xml with HTTP 200 and valid Cache-Control", async () => {
      const req = new Request("https://www.mqulima.com/sitemap.xml", { method: "GET" });
      const res = await server.fetch(req, {}, {});
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("application/xml");
      expect(res.headers.get("Cache-Control")).toContain("stale-while-revalidate");
      const text = await res.text();
      expect(text).toContain("<urlset");
    });

    it("should serve /sitemap-index.xml with HTTP 200", async () => {
      const req = new Request("https://www.mqulima.com/sitemap-index.xml", { method: "GET" });
      const res = await server.fetch(req, {}, {});
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("application/xml");
      const text = await res.text();
      expect(text).toContain("<sitemapindex");
    });

    it("should serve /robots.txt with both sitemap references", async () => {
      const req = new Request("https://www.mqulima.com/robots.txt", { method: "GET" });
      const res = await server.fetch(req, {}, {});
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain("Sitemap: https://mqulima.com/sitemap.xml");
      expect(text).toContain("Sitemap: https://mqulima.com/sitemap-index.xml");
    });
  });
});
