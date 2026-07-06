import { createServerFn } from "@tanstack/react-start";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "MF";
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.map((tag) => String(tag).startsWith("#") ? String(tag) : `#${tag}`).slice(0, 8);
}

export const getForumSnapshot = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getDb } = await import("../db.server");
    const sql = getDb();

    const posts = await sql`
      SELECT
        sp.id,
        sp.type,
        sp.title,
        sp.caption,
        sp.media_urls,
        sp.like_count,
        sp.relate_count,
        sp.comment_count,
        sp.tags,
        sp.created_at,
        p.username,
        p.full_name,
        p.country,
        p.county_region,
        p.farming_interests,
        p.crops,
        p.livestock,
        p.years_farming,
        p.certifications,
        p.reputation_score,
        p.followers_count,
        p.avatar_url
      FROM show_posts sp
      JOIN profiles p ON p.id = sp.user_id
      ORDER BY sp.created_at DESC
      LIMIT 30
    `;

    const comments = posts.length > 0
      ? await sql`
          SELECT sc.post_id, sc.body, sc.created_at, p.username, p.full_name
          FROM show_comments sc
          JOIN profiles p ON p.id = sc.user_id
          WHERE sc.post_id IN ${sql(posts.map((post: any) => post.id))}
          ORDER BY sc.created_at ASC
          LIMIT 120
        `.catch(() => [])
      : [];

    const commentsByPost = new Map<string, any[]>();
    for (const comment of comments as any[]) {
      const list = commentsByPost.get(comment.post_id) || [];
      list.push({
        authorName: comment.username || comment.full_name || "Mqulima Farmer",
        text: comment.body,
        time: new Date(comment.created_at).toLocaleDateString(),
      });
      commentsByPost.set(comment.post_id, list);
    }

    const listings = await sql`
      SELECT
        cl.id,
        co.name AS commodity,
        co.unit,
        cl.quantity::float AS quantity,
        cl.asking_price::float AS asking_price,
        cl.location,
        cl.description,
        cl.image_urls,
        cl.status,
        cl.created_at,
        p.username,
        p.full_name,
        p.country,
        p.county_region,
        p.farming_interests,
        p.crops,
        p.livestock,
        p.years_farming,
        p.certifications,
        p.reputation_score,
        p.followers_count,
        p.avatar_url
      FROM commodity_listings cl
      JOIN commodities co ON co.id = cl.commodity_id
      JOIN profiles p ON p.id = cl.user_id
      WHERE cl.status = 'active'
      ORDER BY cl.created_at DESC
      LIMIT 24
    `;

    const pulse = await sql`
      SELECT id, title, body, category, source_url, published_at
      FROM pulse_posts
      ORDER BY published_at DESC
      LIMIT 20
    `;

    const toFarmer = (row: any) => ({
      username: row.username?.startsWith("@") ? row.username : `@${row.username || "mqulima_farmer"}`,
      name: row.full_name || "Mqulima Farmer",
      country: row.country || "Kenya",
      county: row.county_region || "Kenya",
      interests: row.farming_interests || [],
      crops: row.crops || [],
      livestock: row.livestock || [],
      yearsFarming: row.years_farming || 0,
      certifications: row.certifications || [],
      reputationScore: row.reputation_score || 0,
      followers: Array.from({ length: Math.min(row.followers_count || 0, 12) }, (_, index) => `follower_${index + 1}`),
      avatar: row.avatar_url || initials(row.full_name || row.username || "Mqulima Farmer"),
      coverImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
    });

    return {
      showPosts: posts.map((post: any) => ({
        id: post.id,
        author: toFarmer(post),
        title: post.title || "Untitled discussion",
        body: post.caption || "",
        type: post.type === "harvest" ? "gallery" : post.type === "story" ? "story" : "update",
        category: post.type === "tragedy" ? "Tragedy" : post.type === "learning" ? "Learning" : post.type === "harvest" ? "Harvest" : "Moment",
        images: post.media_urls || [],
        likes: post.like_count || 0,
        relates: post.relate_count || 0,
        comments: commentsByPost.get(post.id) || [],
        tags: normalizeTags(post.tags),
        createdAt: new Date(post.created_at).toLocaleDateString(),
      })),
      sokoListings: listings.map((listing: any) => ({
        id: listing.id,
        author: toFarmer(listing),
        commodity: listing.commodity,
        type: /cow|goat|sheep|poultry|pig|fish|milk|egg/i.test(listing.commodity) ? "livestock" : "crop",
        price: listing.asking_price,
        quantity: `${listing.quantity} ${listing.unit}`,
        location: listing.location || listing.county_region || "Kenya",
        images: listing.image_urls || [],
        description: listing.description || "Verified community listing.",
        status: listing.status === "sold" ? "sold" : "available",
        createdAt: new Date(listing.created_at).toLocaleDateString(),
      })),
      pulsePosts: pulse.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.body,
        category: item.category || "Agronomy Alert",
        source: item.source_url,
        date: new Date(item.published_at).toLocaleDateString(),
      })),
    };
  });
