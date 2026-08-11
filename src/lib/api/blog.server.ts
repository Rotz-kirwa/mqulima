import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ============================================================================
// BLOG / NEWS — Server Functions (Main Platform)
// ============================================================================

/**
 * Fetch all published blog posts & agritech news, joined with author profile name.
 * Used by the main /blog & /news pages.
 */
export const getPublishedBlogPosts = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getDb } = await import("../db.server");
    const sql = getDb();

    // Ensure agritech_news table columns exist
    await sql`
      ALTER TABLE agritech_news 
      ADD COLUMN IF NOT EXISTS media_type varchar(20) DEFAULT 'image',
      ADD COLUMN IF NOT EXISTS media_url text;
    `;

    // Fetch published agritech news from CMS table
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
        published_at AS "publishedAt",
        created_at AS "createdAt"
      FROM agritech_news
      WHERE status = 'published'
      ORDER BY published_at DESC NULLS LAST
    `;

    // Fetch published blog posts
    let legacyPosts: any[] = [];
    try {
      legacyPosts = await sql`
        SELECT
          bp.id,
          bp.title,
          bp.slug,
          bp.cover_image AS "mediaUrl",
          bp.excerpt,
          bp.body,
          bp.category,
          bp.status,
          bp.published_at AS "publishedAt",
          bp.view_count AS "viewCount",
          bp.created_at AS "createdAt",
          p.full_name   AS "authorName",
          p.username    AS author_username,
          ba.bio        AS author_bio
        FROM blog_posts bp
        LEFT JOIN blog_authors ba ON ba.id = bp.author_id
        LEFT JOIN profiles p      ON p.id  = ba.profile_id
        WHERE bp.status = 'published'
        ORDER BY bp.published_at DESC NULLS LAST
      `;
    } catch (_) {
      legacyPosts = [];
    }

    const formattedAgritech = agritechArticles.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      coverImage: (row.mediaUrl as string) || "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80",
      mediaType: (row.mediaType as "image" | "video") || "image",
      mediaUrl: (row.mediaUrl as string) || "",
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
      viewCount: 1,
      readTime: `${Math.max(2, Math.ceil(((row.body as string) || "").split(" ").length / 150))} min read`,
      author: {
        name: (row.authorName as string) || "Mqulima Editorial Desk",
        role: "Agritech News Desk",
        avatarInitials: "MN",
        bio: "Official Mqulima Agricultural Intelligence & Extension Division",
      },
    }));

    const formattedLegacy = legacyPosts.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      coverImage: (row.mediaUrl as string) || "",
      mediaType: "image" as const,
      mediaUrl: (row.mediaUrl as string) || "",
      excerpt: (row.excerpt as string) || "",
      body: row.body as string,
      category: (row.category as string) || "General",
      publishedAt: row.publishedAt
        ? new Date(row.publishedAt as string).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "",
      viewCount: (row.viewCount as number) || 0,
      readTime: `${Math.max(2, Math.ceil(((row.body as string) || "").split(" ").length / 150))} min read`,
      author: {
        name: (row.authorName as string) || "Mqulima Author",
        role: "Mqulima Agronomist",
        avatarInitials: ((row.authorName as string) || "MA")
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        bio: (row.author_bio as string) || "",
      },
    }));

    return [...formattedAgritech, ...formattedLegacy];
  }
);

/**
 * Increment view count for a blog post.
 */
export const incrementBlogViewCount = createServerFn({ method: "POST" })
  .inputValidator(z.object({ postId: z.string() }))
  .handler(async ({ data }) => {
    try {
      const { getDb } = await import("../db.server");
      const sql = getDb();
      await sql`
        UPDATE blog_posts
        SET view_count = COALESCE(view_count, 0) + 1
        WHERE id = ${data.postId}
      `;
    } catch (_) {}
    return { success: true };
  });
