import { getDb } from "../db.server";

export async function handleListNews(url: URL): Promise<Response> {
  try {
    const category = url.searchParams.get("category") || url.searchParams.get("group") || "All";
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));

    const sql = getDb();
    let whereClause = sql`LOWER(status) = 'published'`;

    if (category && category !== "All" && category.trim()) {
      whereClause = sql`${whereClause} AND (category ILIKE ${category.trim()})`;
    }

    const rows = await sql`
      SELECT 
        id,
        title,
        slug,
        summary,
        summary AS excerpt,
        content,
        media_type AS "mediaType",
        COALESCE(media_url, 'https://cdn.mqulima.com/news/default.webp') AS image,
        category,
        category AS "group",
        source_attribution AS "sourceAttribution",
        COALESCE(view_count, 0) AS reads,
        published_at AS date,
        created_at
      FROM agritech_news
      ${whereClause}
      ORDER BY published_at DESC NULLS LAST, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const articles = rows.map((r: any, idx: number) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt || r.summary || "",
      image: r.image,
      category: r.category || "Agronomy & Farm Tips",
      group: r.group || "Agronomy & Farm Tips",
      readTime: "3 min read",
      date: r.date ? new Date(r.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      reads: r.reads,
      featured: idx === 0,
      body: r.content ? r.content.split("\n\n").filter(Boolean) : [r.excerpt],
    }));

    return new Response(JSON.stringify(articles), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60, s-maxage=300" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to fetch news" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleGetNewsArticle(identifier: string): Promise<Response> {
  try {
    const sql = getDb();
    const [r] = await sql`
      UPDATE agritech_news
      SET view_count = COALESCE(view_count, 0) + 1
      WHERE id = ${identifier} OR slug = ${identifier}
      RETURNING 
        id, title, slug, summary, content, media_url, category, 
        source_attribution, view_count, published_at, created_at
    `;

    if (!r) {
      return new Response(
        JSON.stringify({ success: false, error: "Article not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const article = {
      id: r.id,
      title: r.title,
      slug: r.slug,
      excerpt: r.summary || "",
      image: r.media_url || "https://cdn.mqulima.com/news/default.webp",
      category: r.category || "Agronomy & Farm Tips",
      group: r.category || "Agronomy & Farm Tips",
      readTime: "3 min read",
      date: r.published_at ? new Date(r.published_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      reads: r.view_count || 1,
      featured: false,
      body: r.content ? r.content.split("\n\n").filter(Boolean) : [r.summary],
      sourceAttribution: r.source_attribution,
    };

    return new Response(JSON.stringify(article), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
