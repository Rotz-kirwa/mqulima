import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/lib/db.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";
import fs from "node:fs";
import path from "node:path";

function flushNewsCaches() {
  try {
    const { invalidateNewsApiCache } = require("@/routes/api/news");
    invalidateNewsApiCache();
  } catch (e) {}
  try {
    const { invalidateBlogCache } = require("@/lib/api/blog.server");
    invalidateBlogCache();
  } catch (e) {}
}

export const Route = createFileRoute("/api/admin/news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request, "content.read");
        if ("response" in auth) return auth.response;
        try {
          const sql = getDb();
          const url = new URL(request.url);
          const targetId = url.searchParams.get("id");

          if (targetId) {
            const [article] = await sql`
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
                author_id AS "authorId",
                status,
                view_count AS "viewCount",
                published_at AS "publishedAt",
                created_at AS "createdAt"
              FROM agritech_news
              WHERE id = ${targetId}
              LIMIT 1
            `;

            if (!article) {
              return new Response(JSON.stringify({ success: false, error: "Article not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
              });
            }

            return new Response(JSON.stringify({ success: true, article }), {
              headers: { 
                "Content-Type": "application/json",
                "Cache-Control": "no-store, no-cache, must-revalidate",
              },
            });
          }

          const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
          const list = await sql`
            SELECT 
              id,
              title,
              slug,
              summary,
              media_type AS "mediaType",
              media_url AS "mediaUrl",
              category,
              source_attribution AS "sourceAttribution",
              author_id AS "authorId",
              status,
              view_count AS "viewCount",
              published_at AS "publishedAt",
              created_at AS "createdAt"
            FROM agritech_news
            ORDER BY created_at DESC
            LIMIT ${limit}
          `;

          return new Response(JSON.stringify({ success: true, articles: list }), {
            headers: { 
              "Content-Type": "application/json",
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          });
        } catch (error: any) {
          console.error("Fetch admin news error:", error);
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      POST: async ({ request }) => {
        const auth = await requireAdminAuth(request, "content.create");
        if ("response" in auth) return auth.response;
        try {
          const body = await request.json();
          const { id, title, summary, content, mediaType = "image", mediaUrl = "", category, sourceAttribution, status = "draft" } = body;

          // 1. Validation: Article Title
          if (!title || !title.trim()) {
            return new Response(
              JSON.stringify({ success: false, error: "Article title is required" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          if (title.trim().length > 150) {
            return new Response(
              JSON.stringify({ success: false, error: "Article title cannot exceed 150 characters" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // 2. Validation: Content
          if (!content || !content.trim()) {
            return new Response(
              JSON.stringify({ success: false, error: "Article content is required" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // 3. Validation: Media Type
          if (mediaType !== "image" && mediaType !== "video") {
            return new Response(
              JSON.stringify({ success: false, error: "Invalid media type. Must be image or video" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          let finalMediaUrl = mediaUrl;
          if (finalMediaUrl && typeof finalMediaUrl === "string" && finalMediaUrl.startsWith("data:image/")) {
            try {
              const match = finalMediaUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
              if (match) {
                const ext = match[1] === "jpeg" ? "jpg" : match[1];
                const base64Data = match[2];
                const filename = `news-${Date.now()}.${ext}`;
                const outDir = path.resolve("public/images/news");
                if (!fs.existsSync(outDir)) {
                  fs.mkdirSync(outDir, { recursive: true });
                }
                fs.writeFileSync(path.join(outDir, filename), Buffer.from(base64Data, "base64"));
                finalMediaUrl = `/images/news/${filename}`;
              }
            } catch (err) {
              console.warn("Failed to persist data URI to file:", err);
            }
          }

          const sql = getDb();
          const cleanTitle = title.trim();
          const cleanSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          const finalSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;

          let articleId = id;

          if (id) {
            // Update existing article
            await sql`
              UPDATE agritech_news
              SET
                title = ${cleanTitle},
                summary = ${summary || cleanTitle},
                content = ${content},
                media_type = ${mediaType},
                media_url = ${finalMediaUrl},
                category = ${category || "Agri-News"},
                source_attribution = ${sourceAttribution || "Mqulima Editorial Desk"},
                status = ${status},
                published_at = ${status === "published" ? sql`COALESCE(published_at, NOW())` : null}
              WHERE id = ${id}
            `;
          } else {
            // Insert new article
            articleId = `news-${Date.now()}`;
            await sql`
              INSERT INTO agritech_news (
                id, title, slug, summary, content, media_type, media_url, category, source_attribution, status, published_at
              ) VALUES (
                ${articleId},
                ${cleanTitle},
                ${finalSlug},
                ${summary || cleanTitle},
                ${content},
                ${mediaType},
                ${finalMediaUrl},
                ${category || "Agri-News"},
                ${sourceAttribution || "Mqulima Editorial Desk"},
                ${status},
                ${status === "published" ? sql`NOW()` : null}
              )
            `;
          }

          flushNewsCaches();

          return new Response(
            JSON.stringify({ success: true, message: "Agritech news article saved successfully", id: articleId }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (error: any) {
          console.error("Save news article error:", error);
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      DELETE: async ({ request }) => {
        const auth = await requireAdminAuth(request, "content.delete");
        if ("response" in auth) return auth.response;
        try {
          let articleId: string | null = null;

          try {
            const body = await request.json();
            if (body && body.id) articleId = body.id;
          } catch (_) {}

          if (!articleId) {
            const url = new URL(request.url, "http://localhost");
            articleId = url.searchParams.get("id");
          }

          if (!articleId) {
            return new Response(
              JSON.stringify({ success: false, error: "Article ID is required for deletion." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const sql = getDb();
          
          // Delete from agritech_news
          await sql`
            DELETE FROM agritech_news
            WHERE id = ${articleId}
          `;

          // Also delete from legacy blog_posts if present
          try {
            await sql`
              DELETE FROM blog_posts
              WHERE id = ${articleId}
            `;
          } catch (_) {}

          flushNewsCaches();

          return new Response(
            JSON.stringify({ success: true, message: "Article deleted successfully" }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (error: any) {
          console.error("Delete article error:", error);
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
