import { withDbRetry } from "../db.server";

function stripHtmlToParagraphs(htmlOrText: string, fallback: string): string[] {
  if (!htmlOrText || !htmlOrText.trim()) return fallback ? [fallback] : [];
  const cleaned = htmlOrText
    .replace(/<\/(p|div|h1|h2|h3|h4|li|blockquote|tr)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  const paras = cleaned
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);

  return paras.length > 0 ? paras : fallback ? [fallback] : [];
}

function mapCategoryToGroup(cat: string): string {
  const c = (cat || "").toLowerCase().trim();
  if (c.includes("livestock") || c.includes("dairy") || c.includes("poultry") || c.includes("vet")) {
    return "Livestock & Dairy";
  }
  if (c.includes("market") || c.includes("policy") || c.includes("econom") || c.includes("price")) {
    return "Policy & Market";
  }
  if (c.includes("weather") || c.includes("climate") || c.includes("rain") || c.includes("special report")) {
    return "Weather Advisory";
  }
  if (c.includes("tech") || c.includes("tool") || c.includes("digital") || c.includes("ai")) {
    return "Agri-Tech & Tools";
  }
  return "Agronomy & Farm Tips";
}

function matchesCategoryFilter(rowCategory: string, filterCategory: string): boolean {
  if (!filterCategory || filterCategory === "All") return true;
  const f = filterCategory.toLowerCase().trim();
  const c = (rowCategory || "").toLowerCase().trim();
  const g = mapCategoryToGroup(rowCategory).toLowerCase();
  if (c === f || g === f) return true;
  if (f.includes("market") && (c.includes("market") || c.includes("policy"))) return true;
  if ((f.includes("agronomy") || f.includes("farm")) && (c.includes("agronomy") || c.includes("farm") || c.includes("crop"))) return true;
  if (f.includes("tech") && (c.includes("tech") || c.includes("tool"))) return true;
  if (f.includes("weather") && (c.includes("weather") || c.includes("special") || c.includes("climate"))) return true;
  if (f.includes("livestock") && (c.includes("livestock") || c.includes("dairy"))) return true;
  return c.includes(f) || f.includes(c);
}

export async function handleListNews(url: URL): Promise<Response> {
  try {
    const category = url.searchParams.get("category") || url.searchParams.get("group") || "All";
    const search = (url.searchParams.get("search") || url.searchParams.get("q") || "").trim().toLowerCase();
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));

    const rows = await withDbRetry((sql) => sql`
      SELECT 
        id,
        title,
        slug,
        summary,
        summary AS excerpt,
        content,
        media_type AS "mediaType",
        COALESCE(media_url, '/images/news/milk-wars-why-kenya-s-dairy-industry-is-bordering-a-lose-lose-situation-1786-cover.webp') AS image,
        category,
        source_attribution AS "sourceAttribution",
        COALESCE(view_count, 12) AS reads,
        published_at AS date,
        created_at
      FROM agritech_news
      WHERE LOWER(status) = 'published'
      ORDER BY published_at DESC NULLS LAST, created_at DESC
      LIMIT 100
    `);

    const filteredRows = rows.filter((r: any) => {
      if (!matchesCategoryFilter(r.category || "", category)) return false;
      if (search) {
        const hay = `${r.title || ""} ${r.summary || ""} ${r.category || ""} ${r.content || ""}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });

    const sliced = filteredRows.slice(offset, offset + limit);

    const articles = sliced.map((r: any, idx: number) => {
      const excerpt = (r.excerpt || r.summary || r.title || "").trim();
      const bodyParas = stripHtmlToParagraphs(r.content || "", excerpt);
      const wordCount = bodyParas.join(" ").split(/\s+/).filter(Boolean).length;
      const readMins = Math.max(2, Math.ceil(wordCount / 180));
      const pubDate = r.date || r.created_at;
      let formattedDate = "Recent";
      try {
        if (pubDate) {
          const d = new Date(pubDate);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          }
        }
      } catch {}

      return {
        id: String(r.id || r.slug),
        slug: r.slug || String(r.id),
        title: r.title || "Agricultural Update",
        excerpt,
        image: r.image,
        coverImage: r.image,
        mediaType: r.mediaType === "video" ? "video" : "image",
        category: r.category || "Agronomy & Farm Tips",
        group: mapCategoryToGroup(r.category || ""),
        readTime: `${readMins} min read`,
        date: formattedDate,
        publishedAt: formattedDate,
        reads: Number(r.reads || 12),
        viewCount: Number(r.reads || 12),
        featured: idx === 0,
        isFeatured: idx < 3,
        author: {
          name: r.sourceAttribution && !r.sourceAttribution.toLowerCase().includes("mqulima") ? r.sourceAttribution : "Mqulima Desk",
          role: "Editorial & Agronomy Desk",
          avatarInitials: "MD",
        },
        body: bodyParas,
        rawHtml: r.content || excerpt,
      };
    });

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
    const [r] = await withDbRetry((sql) => sql`
      UPDATE agritech_news
      SET view_count = COALESCE(view_count, 0) + 1
      WHERE id::text = ${identifier} OR slug = ${identifier}
      RETURNING 
        id, title, slug, summary, content, media_type AS "mediaType", media_url, category, 
        source_attribution, view_count, published_at, created_at
    `);

    if (!r) {
      return new Response(
        JSON.stringify({ success: false, error: "Article not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const excerpt = (r.summary || r.title || "").trim();
    const bodyParas = stripHtmlToParagraphs(r.content || "", excerpt);
    const wordCount = bodyParas.join(" ").split(/\s+/).filter(Boolean).length;
    const readMins = Math.max(2, Math.ceil(wordCount / 180));
    const pubDate = r.published_at || r.created_at;
    let formattedDate = "Recent";
    try {
      if (pubDate) {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        }
      }
    } catch {}

    const article = {
      id: String(r.id || r.slug),
      slug: r.slug || String(r.id),
      title: r.title,
      excerpt,
      image: r.media_url || "/images/news/milk-wars-why-kenya-s-dairy-industry-is-bordering-a-lose-lose-situation-1786-cover.webp",
      coverImage: r.media_url || "/images/news/milk-wars-why-kenya-s-dairy-industry-is-bordering-a-lose-lose-situation-1786-cover.webp",
      mediaType: r.mediaType === "video" ? "video" : "image",
      category: r.category || "Agronomy & Farm Tips",
      group: mapCategoryToGroup(r.category || ""),
      readTime: `${readMins} min read`,
      date: formattedDate,
      publishedAt: formattedDate,
      reads: Number(r.view_count || 12),
      viewCount: Number(r.view_count || 12),
      featured: false,
      author: {
        name: r.source_attribution && !r.source_attribution.toLowerCase().includes("mqulima") ? r.source_attribution : "Mqulima Desk",
        role: "Editorial & Agronomy Desk",
        avatarInitials: "MD",
      },
      body: bodyParas,
      rawHtml: r.content || excerpt,
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
