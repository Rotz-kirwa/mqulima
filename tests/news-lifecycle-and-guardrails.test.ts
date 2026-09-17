import { describe, it, expect } from "vitest";
import postgres from "postgres";

describe("Agritech News & Blog Architecture Guardrails", () => {
  describe("1. Media Payload Gating & Size Guardrail", () => {
    it("rejects base64 data payloads exceeding 500KB with 413 Payload Too Large", () => {
      const validateMediaPayload = (mediaUrl: string | undefined | null) => {
        if (mediaUrl && typeof mediaUrl === "string" && mediaUrl.startsWith("data:") && mediaUrl.length > 500_000) {
          return {
            valid: false,
            status: 413,
            error: "Uploaded image payload is too large (exceeds 500KB limit). Please compress the image or use an image URL.",
          };
        }
        return { valid: true, status: 200 };
      };

      // Case A: Excessive base64 string (> 500,000 characters)
      const hugeBase64 = "data:image/jpeg;base64," + "A".repeat(500_001);
      const hugeResult = validateMediaPayload(hugeBase64);
      expect(hugeResult.valid).toBe(false);
      expect(hugeResult.status).toBe(413);
      expect(hugeResult.error).toContain("exceeds 500KB limit");

      // Case B: Well-compressed base64 string (< 500,000 characters, e.g. ~200KB canvas JPEG)
      const compressedBase64 = "data:image/jpeg;base64," + "A".repeat(215_000);
      const compressedResult = validateMediaPayload(compressedBase64);
      expect(compressedResult.valid).toBe(true);
      expect(compressedResult.status).toBe(200);

      // Case C: Standard remote URL (e.g., Cloudinary / S3 / Unsplash / placeholder)
      const standardUrl = "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1000";
      const standardResult = validateMediaPayload(standardUrl);
      expect(standardResult.valid).toBe(true);
      expect(standardResult.status).toBe(200);
    });

    it("verifies all records in agritech_news satisfy the < 500KB media size limit", async () => {
      if (!process.env.DATABASE_URL) {
        console.warn("Skipping live database test: DATABASE_URL not set");
        return;
      }

      const sql = postgres(process.env.DATABASE_URL, {
        ssl: { rejectUnauthorized: false },
      });

      try {
        const oversizedRecords = await sql`
          SELECT id, title, LENGTH(media_url) as media_len
          FROM agritech_news
          WHERE LENGTH(media_url) > 500000
        `;

        // No record should exceed 500,000 bytes
        expect(oversizedRecords.length).toBe(0);
      } finally {
        await sql.end();
      }
    });
  });

  describe("2. Single Source of Truth & Article Schema Contract", () => {
    it("verifies published articles contain all mandatory fields required by frontend", async () => {
      if (!process.env.DATABASE_URL) {
        console.warn("Skipping live database test: DATABASE_URL not set");
        return;
      }

      const sql = postgres(process.env.DATABASE_URL, {
        ssl: { rejectUnauthorized: false },
      });

      try {
        const publishedArticles = await sql`
          SELECT
            id,
            title,
            slug,
            summary,
            content,
            media_type,
            media_url,
            category,
            source_attribution,
            view_count,
            status,
            published_at,
            created_at
          FROM agritech_news
          WHERE LOWER(status) = 'published'
        `;

        expect(publishedArticles.length).toBeGreaterThan(0);

        for (const article of publishedArticles) {
          expect(article.id).toBeDefined();
          expect(typeof article.title).toBe("string");
          expect(article.title.trim().length).toBeGreaterThan(0);
          expect(typeof article.slug).toBe("string");
          expect(article.slug.trim().length).toBeGreaterThan(0);
          expect(typeof article.content).toBe("string");
          expect(article.content.trim().length).toBeGreaterThan(0);
          expect(article.status).toBe("published");

          // Ensure view_count column exists and is numeric (defaults to 0 or positive integer)
          const viewCount = article.view_count !== null ? Number(article.view_count) : 0;
          expect(viewCount).toBeGreaterThanOrEqual(0);
        }
      } finally {
        await sql.end();
      }
    });
  });

  describe("3. Pagination & Query Bounds Logic", () => {
    it("sanitizes limit and offset query parameters within safe boundaries", () => {
      const sanitizePagination = (limitParam?: string | null, offsetParam?: string | null) => {
        const rawLimit = parseInt(limitParam || "50", 10);
        const rawOffset = parseInt(offsetParam || "0", 10);

        const limit = isNaN(rawLimit) ? 50 : Math.min(Math.max(1, rawLimit), 100);
        const offset = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);

        return { limit, offset };
      };

      // Normal valid input
      expect(sanitizePagination("20", "10")).toEqual({ limit: 20, offset: 10 });

      // Negative values clamped
      expect(sanitizePagination("-5", "-20")).toEqual({ limit: 1, offset: 0 });

      // Unbound high limit clamped to 100 to protect server memory
      expect(sanitizePagination("5000", "0")).toEqual({ limit: 100, offset: 0 });

      // Non-numeric garbage defaults safely
      expect(sanitizePagination("invalid", "invalid")).toEqual({ limit: 50, offset: 0 });
    });
  });

  describe("4. View Count Increment Integrity", () => {
    it("increments view_count correctly on agritech_news", async () => {
      if (!process.env.DATABASE_URL) {
        console.warn("Skipping live database test: DATABASE_URL not set");
        return;
      }

      const sql = postgres(process.env.DATABASE_URL, {
        ssl: { rejectUnauthorized: false },
      });

      try {
        const [target] = await sql`
          SELECT id, COALESCE(view_count, 0) as current_views
          FROM agritech_news
          LIMIT 1
        `;

        if (!target) return;

        const initialViews = Number(target.current_views);

        // Perform increment
        await sql`
          UPDATE agritech_news
          SET view_count = COALESCE(view_count, 0) + 1
          WHERE id = ${target.id}
        `;

        const [updated] = await sql`
          SELECT COALESCE(view_count, 0) as new_views
          FROM agritech_news
          WHERE id = ${target.id}
        `;

        expect(Number(updated.new_views)).toBe(initialViews + 1);
      } finally {
        await sql.end();
      }
    });
  });
});
