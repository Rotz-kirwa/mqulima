import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ============================================================================
// BLOG / NEWS — Server Functions (Main Platform)
// ============================================================================

const BlogQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  category: z.string().optional(),
});

export type BlogQueryInput = z.infer<typeof BlogQuerySchema>;

/**
 * Fetch published blog posts & agritech news from agritech_news table.
 * Used by the main /blog & /news pages, community previews, and homepage.
 */
export const getPublishedBlogPosts = createServerFn({ method: "GET" })
  .inputValidator(BlogQuerySchema.optional())
  .handler(async ({ data }) => {
    const { getDb } = await import("../db.server");
    const sql = getDb();
    const { limit = 50, offset = 0, category } = data || {};

    let whereClause = sql`WHERE LOWER(status) = 'published'`;
    if (category && category !== "All" && category.trim()) {
      whereClause = sql`${whereClause} AND (category ILIKE ${category.trim()})`;
    }

    // Fetch published agritech news from CMS table (single source of truth for Admin CMS and Main Site)
    const agritechArticles = await sql`
      SELECT
        id,
        title,
        slug,
        summary AS excerpt,
        content AS body,
        media_type AS "mediaType",
        media_url AS "mediaUrl",
        category,
        source_attribution AS "authorName",
        view_count AS "viewCount",
        published_at AS "publishedAt",
        created_at AS "createdAt"
      FROM agritech_news
      ${whereClause}
      ORDER BY published_at DESC NULLS LAST, created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return agritechArticles.map((row) => {
      const media = (row.mediaUrl as string) || "";
      const isVideo = row.mediaType === "video";
      return {
        id: row.id as string,
        title: row.title as string,
        slug: row.slug as string,
        coverImage: media || "/placeholder-product.png",
        mediaType: (isVideo ? "video" : "image") as "image" | "video",
        mediaUrl: isVideo ? media : "",
        excerpt: (row.excerpt as string) || "",
        body: row.body as string,
        category: (row.category as string) || "Policy & Market",
        publishedAt: row.publishedAt
          ? new Date(row.publishedAt as string).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : new Date(row.createdAt as string).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
        viewCount: typeof row.viewCount === "number" ? row.viewCount : 0,
        readTime: `${Math.max(2, Math.ceil(((row.body as string) || "").split(" ").length / 150))} min read`,
        author: {
          name: (row.authorName as string) || "Mqulima Editorial Desk",
          role: "Agritech News Desk",
          avatarInitials: "MN",
          bio: "Official Mqulima Agricultural Intelligence & Extension Division",
        },
      };
    });
  });

/**
 * Fetch a single published article by slug.
 */
export const getBlogPostBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const { getDb } = await import("../db.server");
    const sql = getDb();

    const [row] = await sql`
      SELECT
        id,
        title,
        slug,
        summary AS excerpt,
        content AS body,
        media_type AS "mediaType",
        media_url AS "mediaUrl",
        category,
        source_attribution AS "authorName",
        view_count AS "viewCount",
        published_at AS "publishedAt",
        created_at AS "createdAt"
      FROM agritech_news
      WHERE slug = ${data.slug} AND LOWER(status) = 'published'
      LIMIT 1
    `;

    if (!row) return null;

    const media = (row.mediaUrl as string) || "";
    const isVideo = row.mediaType === "video";
    return {
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      coverImage: media || "/placeholder-product.png",
      mediaType: (isVideo ? "video" : "image") as "image" | "video",
      mediaUrl: isVideo ? media : "",
      excerpt: (row.excerpt as string) || "",
      body: row.body as string,
      category: (row.category as string) || "Policy & Market",
      publishedAt: row.publishedAt
        ? new Date(row.publishedAt as string).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : new Date(row.createdAt as string).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
      viewCount: typeof row.viewCount === "number" ? row.viewCount : 0,
      readTime: `${Math.max(2, Math.ceil(((row.body as string) || "").split(" ").length / 150))} min read`,
      author: {
        name: (row.authorName as string) || "Mqulima Editorial Desk",
        role: "Agritech News Desk",
        avatarInitials: "MN",
        bio: "Official Mqulima Agricultural Intelligence & Extension Division",
      },
    };
  });

/**
 * Increment view count for a blog / agritech news post.
 * Updates agritech_news (primary) and legacy blog_posts (fallback).
 */
export const incrementBlogViewCount = createServerFn({ method: "POST" })
  .inputValidator(z.object({ postId: z.string() }))
  .handler(async ({ data }) => {
    try {
      const { getDb } = await import("../db.server");
      const sql = getDb();
      
      // Update agritech_news
      await sql`
        UPDATE agritech_news
        SET view_count = COALESCE(view_count, 0) + 1
        WHERE id = ${data.postId}
      `;

      // Also update legacy blog_posts if present
      try {
        await sql`
          UPDATE blog_posts
          SET view_count = COALESCE(view_count, 0) + 1
          WHERE id = ${data.postId}
        `;
      } catch (_) {}
    } catch (err) {
      console.error("Increment blog view count error:", err);
    }
    return { success: true };
  });
