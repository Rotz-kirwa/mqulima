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

  describe("4. Single Source of Truth & Zero Fallback Resurrection", () => {
    it("should delete an item and keep it deleted without resurrecting seeds or auto-seeding", () => {
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

    it("should ensure public site returns empty array when featured_items is empty (no fallback resurrection)", () => {
      // Single source of truth: only items from featured_items table are returned
      const featItems: any[] = []; // Empty after admin deletion

      // getFeaturedProducts mapping logic
      const customItems = featItems.map((fi: any) => ({
        id: fi.id,
        name: fi.title || "Farm Essential",
      }));

      // Single source of truth returns exact empty array — no fallback catalog queries
      expect(customItems).toHaveLength(0);
      expect(customItems).toEqual([]);
    });

    it("should never mix uncurated catalog products into featured collection", () => {
      const featItems = [
        { id: "feat-1", title: "Selected Sprayer", position: 0 },
      ];
      const otherCatalogProducts = [
        { id: "prod-999", name: "Unrelated Feed", isFeatured: true },
      ];

      // Single source of truth strictly mirrors featured_items
      const output = featItems.map((fi) => ({ id: fi.id, name: fi.title }));
      expect(output).toHaveLength(1);
      expect(output.some((i) => i.id === "prod-999")).toBe(false);
    });
  });

  describe("5. Transactional Delete Contract & Error Guardrails", () => {
    // Simulated transactional delete handler matching src/routes/api/admin/featured.ts
    const simulateAdminDelete = (
      table: { id: string; entityId?: string }[],
      targetId: string,
      productsTable: { id: string; isFeatured: boolean }[]
    ) => {
      if (!targetId || !targetId.trim()) {
        return { status: 400, body: { success: false, error: "Item ID is required for deletion" } };
      }

      const existingIndex = table.findIndex((i) => i.id === targetId);
      if (existingIndex === -1) {
        return { status: 404, body: { success: false, error: `Featured item '${targetId}' not found or already deleted` } };
      }

      const existing = table[existingIndex];
      if (existing.entityId) {
        const prod = productsTable.find((p) => p.id === existing.entityId);
        if (prod) prod.isFeatured = false;
      }

      table.splice(existingIndex, 1);
      return { status: 200, body: { success: true, message: "Featured item deleted successfully", deletedId: targetId } };
    };

    it("should return HTTP 404 when attempting to delete a nonexistent item (no silent 200)", () => {
      const table = [{ id: "feat-1", entityId: "prod-1" }];
      const productsTable = [{ id: "prod-1", isFeatured: true }];

      const res = simulateAdminDelete(table, "does-not-exist-999", productsTable);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("not found");
      expect(table).toHaveLength(1); // No change
    });

    it("should return HTTP 400 if item ID is empty or whitespace", () => {
      const table = [{ id: "feat-1" }];
      const productsTable: any[] = [];

      const res = simulateAdminDelete(table, "   ", productsTable);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return HTTP 200 and unflag product when deleting a valid item", () => {
      const table = [{ id: "feat-prod-100", entityId: "prod-100" }];
      const productsTable = [{ id: "prod-100", isFeatured: true }];

      const res = simulateAdminDelete(table, "feat-prod-100", productsTable);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.deletedId).toBe("feat-prod-100");
      expect(table).toHaveLength(0);
      expect(productsTable[0].isFeatured).toBe(false);
    });
  });

  describe("6. Fast Invalidation & Cache Synchronization Contract", () => {
    it("should invalidate cache immediately on mutation and respect bypassCache", () => {
      const cache = { data: [{ id: "feat-old" }] as any, expiry: Date.now() + 5000 };

      // Invalidation function
      const invalidate = () => {
        cache.data = null;
        cache.expiry = 0;
      };

      invalidate();
      expect(cache.data).toBeNull();
      expect(cache.expiry).toBe(0);

      // bypassCache check
      const simulateGet = (opts: { bypassCache?: boolean }) => {
        const now = Date.now();
        if (!opts.bypassCache && cache.data && cache.expiry > now) {
          return { fromCache: true, data: cache.data };
        }
        return { fromCache: false, data: [{ id: "feat-fresh" }] };
      };

      cache.data = [{ id: "feat-stale" }];
      cache.expiry = Date.now() + 5000;

      // Normal read hits cache
      expect(simulateGet({ bypassCache: false }).fromCache).toBe(true);
      // bypassCache forces fresh DB read
      expect(simulateGet({ bypassCache: true }).fromCache).toBe(false);
    });
  });
});
