import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/lib/db.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";

export const Route = createFileRoute("/api/admin/news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          const sql = getDb();

          // Ensure media_type and media_url columns exist in agritech_news table
          await sql`
            ALTER TABLE agritech_news 
            ADD COLUMN IF NOT EXISTS media_type varchar(20) DEFAULT 'image',
            ADD COLUMN IF NOT EXISTS media_url text;
          `;

          const list = await sql`
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
              published_at AS "publishedAt",
              created_at AS "createdAt"
            FROM agritech_news
            ORDER BY created_at DESC
          `;

          return new Response(JSON.stringify({ success: true, articles: list }), {
            headers: { "Content-Type": "application/json" },
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
        const auth = await requireAdminAuth(request);
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
                media_url = ${mediaUrl},
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
                ${mediaUrl},
                ${category || "Agri-News"},
                ${sourceAttribution || "Mqulima Editorial Desk"},
                ${status},
                ${status === "published" ? sql`NOW()` : null}
              )
            `;
          }

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
        const auth = await requireAdminAuth(request);
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
