import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/lib/db.server";
import crypto from "node:crypto";

/**
 * Public REST API Route: GET /api/posts
 * Fast community forum feed endpoint with cursor pagination and in-memory SWR caching.
 */

interface CachedPosts {
  payload: string;
  etag: string;
  timestamp: number;
}

const postsApiCache = new Map<string, CachedPosts>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds fresh

export function invalidatePostsApiCache() {
  postsApiCache.clear();
}

export const Route = createFileRoute("/api/posts")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url, "http://localhost");
          const limitParam = parseInt(url.searchParams.get("limit") || "10", 10);
          const cursor = url.searchParams.get("cursor"); // ISO created_at string
          const category = url.searchParams.get("category");

          const limit = isNaN(limitParam) ? 10 : Math.min(Math.max(1, limitParam), 25);
          const cacheKey = `posts:${category || ""}:${cursor || ""}:${limit}`;
          const ifNoneMatch = request.headers.get("if-none-match");

          const cached = postsApiCache.get(cacheKey);
          const now = Date.now();

          if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
            if (ifNoneMatch && ifNoneMatch === cached.etag) {
              return new Response(null, {
                status: 304,
                headers: {
                  "ETag": cached.etag,
                  "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120",
                },
              });
            }

            return new Response(cached.payload, {
              status: 200,
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120",
                "ETag": cached.etag,
                "Access-Control-Allow-Origin": "*",
                "X-Cache": "HIT",
              },
            });
          }

          const sql = getDb();

          let condition = sql`WHERE (sp.status IS NULL OR sp.status IN ('published', 'active')) AND sp.deleted_at IS NULL`;

          if (cursor) {
            condition = sql`${condition} AND sp.created_at < ${cursor}`;
          }

          if (category && category !== "All" && category.trim()) {
            condition = sql`${condition} AND (sp.type = ${category} OR sp.tags @> ARRAY[${category}])`;
          }

          // Single optimized query with join to profiles and users
          const posts = await sql`
            SELECT
              sp.id,
              sp.type AS category,
              COALESCE(sp.title, 'Farm update') AS title,
              sp.caption AS body,
              sp.media_urls AS "mediaUrls",
              COALESCE(sp.like_count, 0) AS "likeCount",
              COALESCE(sp.comment_count, 0) AS "commentCount",
              COALESCE(sp.tags, ARRAY[]::text[]) AS tags,
              sp.created_at AS "createdAt",
              COALESCE(p.username, CONCAT('@mqulima_', LOWER(REGEXP_REPLACE(COALESCE(u.first_name, 'farmer'), '[^a-zA-Z0-9]', '', 'g')))) AS username,
              COALESCE(p.full_name, CONCAT(u.first_name, ' ', u.last_name), 'Mqulima Farmer') AS "authorName",
              COALESCE(p.county_region, u.county, 'Kenya') AS county,
              COALESCE(p.avatar_url, '') AS "authorAvatar"
            FROM show_posts sp
            LEFT JOIN profiles p ON p.id = sp.user_id
            LEFT JOIN users u ON u.id = sp.user_id
            ${condition}
            ORDER BY sp.created_at DESC
            LIMIT ${limit}
          `;

          const nextCursor = posts.length === limit ? posts[posts.length - 1].createdAt : null;

          const responseData = {
            success: true,
            posts: posts.map((p) => {
              // Ensure no base64 payloads escape into feed preview
              const cleanMedia = (p.mediaUrls || []).map((m: string) => {
                if (typeof m === "string" && m.startsWith("data:image")) {
                  return "/images/mkulima_hero_farm.webp";
                }
                return m;
              });

              return {
                id: p.id,
                title: p.title,
                body: p.body,
                category: p.category || "Farm Progress",
                images: cleanMedia,
                likes: Number(p.likeCount) || 0,
                commentsCount: Number(p.commentCount) || 0,
                cropsTagged: p.tags || [],
                location: p.county || "Kenya",
                createdAt: p.createdAt,
                author: {
                  username: p.username?.startsWith("@") ? p.username : `@${p.username || "farmer"}`,
                  name: p.authorName,
                  county: p.county,
                  avatarUrl: p.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.authorName)}&backgroundColor=1a5438&textColor=ffffff`,
                },
              };
            }),
            nextCursor,
          };

          const bodyStr = JSON.stringify(responseData);
          const etag = `"${crypto.createHash("md5").update(bodyStr).digest("hex")}"`;

          postsApiCache.set(cacheKey, { payload: bodyStr, etag, timestamp: now });

          return new Response(bodyStr, {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120",
              "ETag": etag,
              "Access-Control-Allow-Origin": "*",
              "X-Cache": "MISS",
            },
          });
        } catch (error: any) {
          console.error("Public posts API error:", error);
          return new Response(
            JSON.stringify({ success: false, error: error.message || "Failed to fetch forum posts" }),
            { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
          );
        }
      },
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      },
    },
  },
});
