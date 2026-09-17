import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/lib/db.server";

/**
 * Public REST API Route: GET /api/news
 * Returns published agritech news articles with optional pagination and category filtering.
 * Enables client apps, search engines, mobile apps, and frontend integrations to fetch published news.
 */
export const Route = createFileRoute("/api/news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url, "http://localhost");
          const limitParam = parseInt(url.searchParams.get("limit") || "50", 10);
          const offsetParam = parseInt(url.searchParams.get("offset") || "0", 10);
          const categoryParam = url.searchParams.get("category");

          const limit = isNaN(limitParam) ? 50 : Math.min(Math.max(1, limitParam), 100);
          const offset = isNaN(offsetParam) ? 0 : Math.max(0, offsetParam);

          const sql = getDb();

          let whereClause = sql`WHERE LOWER(status) = 'published'`;
          if (categoryParam && categoryParam !== "All" && categoryParam.trim()) {
            whereClause = sql`${whereClause} AND (category ILIKE ${categoryParam.trim()})`;
          }

          const articles = await sql`
            SELECT 
              id,
              title,
              slug,
              summary,
              content,
              media_type AS "mediaType",
              media_url AS "mediaUrl",
              category,
              source_attribution AS "sourceAttribution",
              view_count AS "viewCount",
              published_at AS "publishedAt",
              created_at AS "createdAt"
            FROM agritech_news
            ${whereClause}
            ORDER BY published_at DESC NULLS LAST, created_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `;

          return new Response(JSON.stringify({ success: true, articles }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=60, s-maxage=300",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (error: any) {
          console.error("Public news API error:", error);
          return new Response(
            JSON.stringify({ success: false, error: error.message || "Failed to fetch news articles" }),
            { 
              status: 500, 
              headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              } 
            }
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
