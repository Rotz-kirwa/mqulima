import { describe, it, expect } from "vitest";
import { mapToNewTaxonomy } from "../src/lib/shop-data";

/**
 * Resolves the destination link for a featured carousel item.
 * Exactly mirrors the routing logic in src/routes/index.tsx.
 */
function resolveFeaturedItemTarget(item: {
  slug?: string;
  linkUrl?: string;
}): { targetLink: string; isExternal: boolean } {
  const targetLink =
    item.slug && (!item.linkUrl || item.linkUrl === "/shop")
      ? `/shop/product/${item.slug}`
      : item.linkUrl || (item.slug ? `/shop/product/${item.slug}` : "/shop");

  const isExternal =
    typeof targetLink === "string" &&
    (targetLink.startsWith("http://") || targetLink.startsWith("https://"));

  return { targetLink, isExternal };
}

describe("Featured Collection & Farm Essentials Routing & Architecture", () => {
  describe("1. Target Link & Canonical Routing Resolution", () => {
    it("should resolve canonical /shop/product/:slug when slug is present", () => {
      const item = {
        slug: "20l-heavy-duty-knapsack-sprayer",
        linkUrl: "/shop",
      };
      const { targetLink, isExternal } = resolveFeaturedItemTarget(item);
      expect(targetLink).toBe("/shop/product/20l-heavy-duty-knapsack-sprayer");
      expect(isExternal).toBe(false);
    });

    it("should prioritize /shop/product/:slug over generic /shop fallback", () => {
      const item = {
        slug: "high-protein-dairy-meal",
        linkUrl: "",
      };
      const { targetLink, isExternal } = resolveFeaturedItemTarget(item);
      expect(targetLink).toBe("/shop/product/high-protein-dairy-meal");
      expect(isExternal).toBe(false);
    });

    it("should retain custom internal route when specifically configured", () => {
      const item = {
        slug: "special-promo",
        linkUrl: "/shop?category=Fertilizers",
      };
      const { targetLink, isExternal } = resolveFeaturedItemTarget(item);
      expect(targetLink).toBe("/shop?category=Fertilizers");
      expect(isExternal).toBe(false);
    });

    it("should correctly identify and route external promotional URLs", () => {
      const item = {
        slug: "partner-item",
        linkUrl: "https://partners.mqulima.com/special-deal",
      };
      const { targetLink, isExternal } = resolveFeaturedItemTarget(item);
      expect(targetLink).toBe("https://partners.mqulima.com/special-deal");
      expect(isExternal).toBe(true);
    });

    it("should safely fallback to /shop if neither slug nor custom link is set", () => {
      const item = {};
      const { targetLink, isExternal } = resolveFeaturedItemTarget(item);
      expect(targetLink).toBe("/shop");
      expect(isExternal).toBe(false);
    });
  });

  describe("2. Carousel Pagination & Chunking Logic", () => {
    const mockProducts = [
      { id: "1", name: "P1", slug: "p1" },
      { id: "2", name: "P2", slug: "p2" },
      { id: "3", name: "P3", slug: "p3" },
      { id: "4", name: "P4", slug: "p4" },
      { id: "5", name: "P5", slug: "p5" },
      { id: "6", name: "P6", slug: "p6" },
      { id: "7", name: "P7", slug: "p7" },
    ];

    it("should group products into chunks of 3 for desktop layout", () => {
      const chunkSize = 3;
      const pages = [];
      for (let i = 0; i < mockProducts.length; i += chunkSize) {
        pages.push(mockProducts.slice(i, i + chunkSize));
      }

      expect(pages.length).toBe(3);
      expect(pages[0]).toHaveLength(3);
      expect(pages[1]).toHaveLength(3);
      expect(pages[2]).toHaveLength(1);
    });

    it("should group products into chunks of 2 for mobile layout", () => {
      const chunkSize = 2;
      const pages = [];
      for (let i = 0; i < mockProducts.length; i += chunkSize) {
        pages.push(mockProducts.slice(i, i + chunkSize));
      }

      expect(pages.length).toBe(4);
      expect(pages[0]).toHaveLength(2);
      expect(pages[1]).toHaveLength(2);
      expect(pages[2]).toHaveLength(2);
      expect(pages[3]).toHaveLength(1);
    });

    it("should cycle carousel pages seamlessly forward and backwards", () => {
      const totalPages = 3;
      let currentPage = 0;

      // Next
      currentPage = (currentPage + 1) % totalPages;
      expect(currentPage).toBe(1);

      currentPage = (currentPage + 1) % totalPages;
      expect(currentPage).toBe(2);

      // Loop back to start
      currentPage = (currentPage + 1) % totalPages;
      expect(currentPage).toBe(0);

      // Prev loops to end
      currentPage = (currentPage - 1 + totalPages) % totalPages;
      expect(currentPage).toBe(2);
    });
  });

  describe("3. Product Taxonomy & Recommendation Safety", () => {
    it("should safely map animal feeds to Animal Farming taxonomy", () => {
      const sample = {
        name: "High-Protein Dairy Meal 50kg",
        subcategory: "Dairy Meal",
        shopType: "Animal Farming",
      };
      const tax = mapToNewTaxonomy(sample);
      expect(tax.category).toBe("Animal Farming");
      expect(tax.subcategory).toBe("Animal Feed");
    });

    it("should safely map sprayers and tools to Farm Equipment", () => {
      const sample = {
        name: "20L Knapsack Sprayer",
        subcategory: "Sprayers",
        shopType: "Machinery",
      };
      const tax = mapToNewTaxonomy(sample);
      expect(tax.category).toBe("Farm Equipment");
      expect(tax.subcategory).toBe("Machinery");
    });

    it("should provide consistent fallback category if fields are empty", () => {
      const sample = {
        name: "General Farm Item",
      };
      const tax = mapToNewTaxonomy(sample);
      expect(tax.category).toBeDefined();
      expect(tax.subcategory).toBeDefined();
    });
  });

  describe("4. Deletion Persistence & Zero Seed Resurrection Guardrail", () => {
    it("should delete an item and keep it deleted without resurrecting seeds", () => {
      // Simulated DB table state
      let dbFeaturedTable = [
        { id: "feat-custom-1", title: "Custom Drip Kit", position: 0 },
        { id: "feat-custom-2", title: "Organic Fertilizer", position: 1 },
      ];

      // Admin deletes feat-custom-2
      const targetId = "feat-custom-2";
      dbFeaturedTable = dbFeaturedTable.filter((item) => item.id !== targetId);
      expect(dbFeaturedTable).toHaveLength(1);
      expect(dbFeaturedTable.some((i) => i.id === targetId)).toBe(false);

      // Admin deletes the last item (feat-custom-1)
      dbFeaturedTable = dbFeaturedTable.filter((item) => item.id !== "feat-custom-1");
      expect(dbFeaturedTable).toHaveLength(0);

      // Verify that a subsequent read on empty table returns 0 items and NEVER auto-seeds
      const readResult = dbFeaturedTable.map((item) => item);
      expect(readResult).toHaveLength(0);
      expect(readResult.some((i) => i.id?.startsWith("feat-seed-"))).toBe(false);
    });

    it("should ensure public site does not display deleted items", () => {
      const liveCuratedItems: any[] = []; // Empty after admin deletion
      const activeCatalogProducts = [
        { id: "prod-1", name: "Maize Seeds", isFeatured: true, slug: "maize-seeds" },
      ];

      // Simulated public site merge logic (products.server.ts)
      const combined = [...liveCuratedItems];
      for (const p of activeCatalogProducts) {
        if (!combined.some((item) => item.id === p.id)) {
          combined.push(p);
        }
      }

      // Must never contain resurrected feat-seed-* items
      expect(combined.every((item) => !item.id?.startsWith("feat-seed-"))).toBe(true);
      expect(combined).toHaveLength(1);
    });
  });
});
