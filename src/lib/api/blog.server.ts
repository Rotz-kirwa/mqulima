import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ============================================================================
// AUTHOR PROFILES (Mqulima Editorial & Agronomy Desk)
// ============================================================================

export interface AuthorProfile {
  name: string;
  role: string;
  avatar: string;
  avatarInitials: string;
  bio: string;
}

export const MQULIMA_DESK_AUTHOR: AuthorProfile = {
  name: "Mqulima Desk",
  role: "Editorial Desk",
  avatar: "/icon-192.png",
  avatarInitials: "MD",
  bio: "Official agricultural reports, market intelligence, and farmer advisories curated and published directly by the Mqulima Desk.",
};

export const EXPERT_AUTHORS: Record<string, AuthorProfile> = {
  desk: MQULIMA_DESK_AUTHOR,
  mqulima: MQULIMA_DESK_AUTHOR,
};

export function resolveAuthor(sourceAttribution?: string | null, _idStr?: string): AuthorProfile {
  const text = (sourceAttribution || "").trim();
  if (
    !text ||
    text.toLowerCase().includes("desk") ||
    text.toLowerCase().includes("mqulima") ||
    text.toLowerCase().includes("grace") ||
    text.toLowerCase().includes("wambui") ||
    text.toLowerCase().includes("kiprop") ||
    text.toLowerCase().includes("muthoni") ||
    text.toLowerCase().includes("omondi")
  ) {
    return MQULIMA_DESK_AUTHOR;
  }

  const initials = text
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "MD";

  return {
    name: text,
    role: "Editorial Contributor",
    avatar: "/icon-192.png",
    avatarInitials: initials,
    bio: `Content and intelligence contribution from ${text}.`,
  };
}

// ============================================================================
// BLOG / NEWS — Server Functions (Main Platform)
// ============================================================================

const BlogQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(9),
  offset: z.coerce.number().int().min(0).optional().default(0),
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
});

export type BlogQueryInput = z.infer<typeof BlogQuerySchema>;

const blogCache = new Map<string, { data: any; expiry: number }>();
const BLOG_CACHE_TTL = 5 * 60 * 1000; // 5 min cache

export function invalidateBlogCache() {
  blogCache.clear();
}

/**
 * Fetch published blog post cards (lightweight, trimmed — NO full body payload).
 * Used by /blog, / (home), and community previews to keep SSR HTML under 150KB.
 */
export const getPublishedBlogPosts = createServerFn({ method: "GET" })
  .inputValidator(BlogQuerySchema.optional())
  .handler(async ({ data }) => {
    const cacheKey = `posts:${JSON.stringify(data || {})}`;
    const now = Date.now();
    const cached = blogCache.get(cacheKey);
    if (cached && cached.expiry > now) {
      return cached.data;
    }

    const { getDb } = await import("../db.server");
    const sql = getDb();
    const { limit = 9, offset = 0, category, search, sort = "newest" } = data || {};

    let queryCondition = sql`WHERE LOWER(status) = 'published'`;

    if (category && category !== "All" && category.trim()) {
      const cat = `%${category.trim()}%`;
      queryCondition = sql`${queryCondition} AND (category ILIKE ${cat})`;
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      queryCondition = sql`${queryCondition} AND (title ILIKE ${q} OR summary ILIKE ${q} OR category ILIKE ${q})`;
    }

    const orderBy = sort === "oldest"
      ? sql`ORDER BY published_at ASC NULLS LAST, created_at ASC`
      : sql`ORDER BY published_at DESC NULLS LAST, created_at DESC`;

    // Fetch ONLY card fields (no heavy HTML content/body in listing)
    const agritechArticles = await sql`
      SELECT
        id,
        title,
        slug,
        summary AS excerpt,
        media_type AS "mediaType",
        media_url AS "mediaUrl",
        category,
        source_attribution AS "authorName",
        view_count AS "viewCount",
        published_at AS "publishedAt",
        created_at AS "createdAt"
      FROM agritech_news
      ${queryCondition}
      ${orderBy}
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const result = agritechArticles.map((row) => {
      const media = (row.mediaUrl as string) || "";
      const isVideo = row.mediaType === "video";
      const excerpt = (row.excerpt as string) || "";
      const author = resolveAuthor(row.authorName as string, row.id as string);

      const pubDate = row.publishedAt ? new Date(row.publishedAt as string) : new Date(row.createdAt as string);

      return {
        id: row.id as string,
        title: row.title as string,
        slug: row.slug as string,
        coverImage: media || "/placeholder-product.png",
        mediaType: (isVideo ? "video" : "image") as "image" | "video",
        mediaUrl: isVideo ? media : "",
        excerpt,
        category: (row.category as string) || "Policy & Market",
        publishedAt: pubDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        publishedIso: pubDate.toISOString(),
        viewCount: typeof row.viewCount === "number" ? row.viewCount : 0,
        readTime: `${Math.max(2, Math.ceil(excerpt.split(/\s+/).length / 25))} min read`,
        author,
        reviewedBy: "Mqulima Agronomy & Intelligence Desk",
      };
    });

    blogCache.set(cacheKey, { data: result, expiry: now + BLOG_CACHE_TTL });
    return result;
  });

/**
 * Fetch category counts for in-blog filtering and counts display.
 */
export const getBlogCategoryCounts = createServerFn({ method: "GET" })
  .handler(async () => {
    const cacheKey = "category_counts";
    const now = Date.now();
    const cached = blogCache.get(cacheKey);
    if (cached && cached.expiry > now) {
      return cached.data;
    }

    try {
      const { getDb } = await import("../db.server");
      const sql = getDb();
      const rows = await sql`
        SELECT category, COUNT(*)::int AS count
        FROM agritech_news
        WHERE LOWER(status) = 'published' AND category IS NOT NULL AND category != ''
        GROUP BY category
        ORDER BY count DESC
      `;
      const totalRow = await sql`
        SELECT COUNT(*)::int AS total
        FROM agritech_news
        WHERE LOWER(status) = 'published'
      `;
      const result = {
        total: totalRow[0]?.total || 0,
        categories: rows.map((r) => ({
          category: r.category as string,
          count: Number(r.count),
        })),
      };
      blogCache.set(cacheKey, { data: result, expiry: now + BLOG_CACHE_TTL });
      return result;
    } catch (err) {
      console.error("[BLOG] Failed to get category counts:", err);
      return { total: 0, categories: [] };
    }
  });

/**
 * Fetch a single published article by slug with full body & content-to-commerce embeds.
 */
export const getBlogPostBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const cacheKey = `slug:${data.slug}`;
    const cached = blogCache.get(cacheKey);
    const now = Date.now();
    if (cached && now < cached.expiry) {
      return cached.data;
    }

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
    const bodyStr = (row.body as string) || "";
    const pubDate = row.publishedAt ? new Date(row.publishedAt as string) : new Date(row.createdAt as string);
    const author = resolveAuthor(row.authorName as string, row.id as string);

    // Fetch related items in parallel via Promise.allSettled
    let relatedPosts: any[] = [];
    let relatedProduct: any = null;
    let relatedService: any = null;

    const [relatedRes, prodRes, servRes] = await Promise.allSettled([
      sql`
        SELECT id, title, slug, summary AS excerpt, media_url AS "coverImage", category, published_at AS "publishedAt"
        FROM agritech_news
        WHERE LOWER(status) = 'published' AND slug != ${data.slug}
        ORDER BY (category = ${row.category}) DESC, published_at DESC
        LIMIT 3
      `,
      sql`
        SELECT id, name, slug, base_price AS price, image_urls AS "imageUrls", badge
        FROM products
        WHERE (LOWER(status) = 'active' OR status IS NULL)
          AND deleted_at IS NULL
          AND external_product_id IS NOT NULL
        ORDER BY is_featured DESC NULLS LAST, created_at DESC
        LIMIT 1
      `,
      sql`
        SELECT id, name, slug, base_price AS price, price_type AS "priceType", description
        FROM services
        ORDER BY created_at DESC
        LIMIT 1
      `,
    ]);

    if (relatedRes.status === "fulfilled") {
      relatedPosts = (relatedRes.value || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        excerpt: r.excerpt || "",
        coverImage: r.coverImage || "/placeholder-product.png",
        category: r.category || "General",
        publishedAt: r.publishedAt ? new Date(r.publishedAt as string).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }) : "",
      }));
    }

    if (prodRes.status === "fulfilled" && prodRes.value && prodRes.value[0]) {
      const p = prodRes.value[0];
      let img = "/placeholder-product.png";
      if (Array.isArray(p.imageUrls) && p.imageUrls.length > 0) {
        img = p.imageUrls[0];
      } else if (typeof p.imageUrls === "string" && p.imageUrls) {
        try {
          const parsed = JSON.parse(p.imageUrls);
          img = Array.isArray(parsed) ? parsed[0] : p.imageUrls;
        } catch {
          img = p.imageUrls;
        }
      }
      relatedProduct = {
        id: p.id,
        name: p.name,
        slug: p.slug || p.id,
        price: p.price ? Number(p.price) : 1500,
        image: img,
        badge: p.badge || "Verified Farm Input",
      };
    }

    if (servRes.status === "fulfilled" && servRes.value && servRes.value[0]) {
      const s = servRes.value[0];
      relatedService = {
        id: s.id,
        name: s.name,
        slug: s.slug || s.id,
        price: s.price ? Number(s.price) : 2500,
        priceType: s.priceType || "per consultation",
        description: s.description || "Expert agronomy, vet and soil testing consultation.",
      };
    }

    const result = {
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      coverImage: media || "/placeholder-product.png",
      mediaType: (isVideo ? "video" : "image") as "image" | "video",
      mediaUrl: isVideo ? media : "",
      excerpt: (row.excerpt as string) || "",
      body: bodyStr,
      category: (row.category as string) || "Policy & Market",
      publishedAt: pubDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      publishedIso: pubDate.toISOString(),
      updatedIso: pubDate.toISOString(),
      viewCount: typeof row.viewCount === "number" ? row.viewCount : 0,
      readTime: `${Math.max(2, Math.ceil(bodyStr.split(/\s+/).length / 160))} min read`,
      author,
      reviewedBy: "Mqulima Agronomy & Intelligence Desk",
      relatedPosts,
      relatedProduct,
      relatedService,
      relatedTool: {
        title: "Crop Fertilizer & NPK Calculator",
        description: "Calculate tailored DAP, CAN, and NPK requirements for your acreage and soil type.",
        link: "/tools",
      },
    };

    blogCache.set(cacheKey, { data: result, expiry: now + BLOG_CACHE_TTL });
    return result;
  });

/**
 * Increment view count for a blog / agritech news post.
 */
export const incrementBlogViewCount = createServerFn({ method: "POST" })
  .inputValidator(z.object({ postId: z.string() }))
  .handler(async ({ data }) => {
    try {
      const { getDb } = await import("../db.server");
      const sql = getDb();

      await sql`
        UPDATE agritech_news
        SET view_count = COALESCE(view_count, 0) + 1
        WHERE id = ${data.postId}
      `;

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
