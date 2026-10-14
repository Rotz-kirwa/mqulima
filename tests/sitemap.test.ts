import { describe, it, expect } from "vitest";
import {
  CANONICAL_ORIGIN,
  STATIC_PUBLIC_ROUTES,
  buildSitemapXmlString,
  escapeXml,
  formatLastmodDate,
  getFallbackSitemapXml,
  generateSitemapXml,
} from "../src/lib/sitemap.server";

describe("Production XML Sitemap & Robots Suite", () => {
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
      // Static routes should not contain <lastmod>
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

  describe("4. End-to-End Dynamic Sitemap Generation", () => {
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
  });
});
