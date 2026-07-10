import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ============================================================================
// BLOG / NEWS — Server Functions (Main Platform)
// ============================================================================

/**
 * Fetch all published blog posts, joined with author profile name.
 * Used by the main /blog page.
 */
export const getPublishedBlogPosts = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getDb } = await import("../db.server");
    const sql = getDb();

    const posts = await sql`
      SELECT
        bp.id,
        bp.title,
        bp.slug,
        bp.cover_image,
        bp.excerpt,
        bp.body,
        bp.category,
        bp.status,
        bp.published_at,
        bp.view_count,
        bp.created_at,
        p.full_name   AS author_name,
        p.username    AS author_username,
        ba.bio        AS author_bio
      FROM blog_posts bp
      JOIN blog_authors ba ON ba.id = bp.author_id
      JOIN profiles p      ON p.id  = ba.profile_id
      WHERE bp.status = 'published'
      ORDER BY bp.published_at DESC NULLS LAST
    `;

    return posts.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      coverImage: (row.cover_image as string) || "",
      excerpt: (row.excerpt as string) || "",
      body: row.body as string,
      category: (row.category as string) || "General",
      publishedAt: row.published_at
        ? new Date(row.published_at as string).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "",
      viewCount: (row.view_count as number) || 0,
      readTime: `${Math.max(2, Math.ceil(((row.body as string) || "").split(" ").length / 150))} min read`,
      author: {
        name: (row.author_name as string) || "Mqulima Author",
        role: "Mqulima Agronomist",
        avatarInitials: ((row.author_name as string) || "MA")
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        bio: (row.author_bio as string) || "",
      },
    }));
  }
);

/**
 * Increment view count for a blog post.
 */
export const incrementBlogViewCount = createServerFn({ method: "POST" })
  .inputValidator(z.object({ postId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { getDb } = await import("../db.server");
    const sql = getDb();
    await sql`
      UPDATE blog_posts
      SET view_count = COALESCE(view_count, 0) + 1
      WHERE id = ${data.postId}
    `;
    return { success: true };
  });

/**
 * Submit a community story / blog post.
 * Creates a draft post attributed to the logged-in user.
 * Requires authentication — returns error if not logged in.
 */
export const submitBlogPost = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      title: z.string().min(5).max(300),
      category: z.string().min(1),
      excerpt: z.string().max(400).optional().default(""),
      body: z.string().min(20),
      coverImage: z.string().url().optional().default(""),
    })
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("../db.server");
    const sql = getDb();

    // Check if a blog_author record exists for the super_admin / any active admin
    // For community submissions we attach them to the first active author
    const [author] = await sql`
      SELECT ba.id
      FROM blog_authors ba
      JOIN profiles p ON p.id = ba.profile_id
      WHERE ba.is_active = TRUE
      ORDER BY ba.created_at
      LIMIT 1
    `;

    if (!author) {
      throw new Error(
        "No active blog author found. Please contact the administrator."
      );
    }

    // Generate a URL-safe slug from title
    const baseSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80);
    const slug = `${baseSlug}-${Date.now()}`;

    await sql`
      INSERT INTO blog_posts (author_id, title, slug, cover_image, excerpt, body, category, status)
      VALUES (
        ${author.id},
        ${data.title},
        ${slug},
        ${data.coverImage || null},
        ${data.excerpt || null},
        ${data.body},
        ${data.category},
        'draft'
      )
    `;

    return { success: true, message: "Story submitted for editorial review." };
  });
