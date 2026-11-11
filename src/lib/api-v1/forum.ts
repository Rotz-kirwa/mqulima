import { getDb } from "../db.server";
import { authenticateRequest } from "./auth-helper";
import { invalidateForumSnapshotCache } from "../api/community.server";

const TYPE_TO_TAG: Record<string, string> = {
  harvest: "Harvest Update",
  story: "Success Story",
  tips: "Farming Tips",
  learning: "Farming Tips",
  question: "Question",
  tragedy: "Question",
  update: "Farm Progress",
  moment: "Farm Progress",
};

function mapTypeToTag(type?: string | null, tags?: string[] | null): string {
  if (type && TYPE_TO_TAG[type.toLowerCase()]) {
    return TYPE_TO_TAG[type.toLowerCase()];
  }
  if (Array.isArray(tags)) {
    for (const t of tags) {
      const clean = String(t).replace(/^#/, "").trim();
      if (Object.values(TYPE_TO_TAG).includes(clean)) return clean;
    }
  }
  return "Farm Progress";
}

function extractLocationFromTags(tags?: string[] | null, fallbackCounty?: string | null): string {
  if (Array.isArray(tags)) {
    for (const t of tags) {
      const s = String(t).trim();
      if (s.startsWith("📍")) {
        return s.replace(/^📍\s*/, "").trim();
      }
    }
  }
  return fallbackCounty || "Kenya";
}

export async function handleForumFeed(request: Request, url: URL): Promise<Response> {
  try {
    const user = await authenticateRequest(request);
    const category = url.searchParams.get("tag") || url.searchParams.get("category") || "All";
    const q = url.searchParams.get("q") || "";
    const scope = url.searchParams.get("scope") || "all";
    const sort = url.searchParams.get("sort") || "latest";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "15", 10)));

    const sql = getDb();
    let whereClause = sql`sp.deleted_at IS NULL AND (sp.status IS NULL OR sp.status IN ('published', 'active'))`;

    if (scope === "mine") {
      if (!user) {
        return new Response(
          JSON.stringify({ success: true, items: [], total: 0, next_page: null, page }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      whereClause = sql`${whereClause} AND sp.user_id = ${user.id}`;
    } else if (scope === "saved") {
      if (!user) {
        return new Response(
          JSON.stringify({ success: true, items: [], total: 0, next_page: null, page }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      whereClause = sql`${whereClause} AND sp.id IN (SELECT post_id FROM show_bookmarks WHERE user_id = ${user.id})`;
    }

    const rows = await sql`
      SELECT
        sp.id,
        sp.user_id,
        sp.type,
        COALESCE(sp.title, '') AS title,
        COALESCE(sp.caption, '') AS text,
        sp.media_urls AS "mediaUrls",
        COALESCE(sp.like_count, 0) AS likes,
        COALESCE(sp.comment_count, 0) AS "commentCount",
        COALESCE(sp.tags, ARRAY[]::text[]) AS tags,
        sp.created_at AS date,
        sp.created_at AS created_at,
        COALESCE(p.username, CONCAT('@mqulima_', LOWER(SUBSTRING(COALESCE(u.first_name, 'farmer'), 1, 8)))) AS handle,
        COALESCE(p.full_name, CONCAT(u.first_name, ' ', u.last_name), 'Mqulima Farmer') AS author,
        COALESCE(p.county_region, u.county, 'Kenya') AS county,
        COALESCE(p.avatar_url, '') AS "authorAvatar"
      FROM show_posts sp
      LEFT JOIN profiles p ON p.id = sp.user_id
      LEFT JOIN users u ON u.id = sp.user_id
      WHERE ${whereClause}
      ORDER BY sp.created_at DESC
      LIMIT 50
    `;

    // Fetch real database comments for posts
    const postIds = rows.map((r: any) => r.id);
    const commentsByPost = new Map<string, any[]>();
    if (postIds.length > 0) {
      const dbComments = await sql`
        SELECT
          sc.id,
          sc.post_id,
          sc.parent_id,
          sc.user_id,
          sc.body AS text,
          sc.created_at AS time,
          COALESCE(pr.full_name, CONCAT(u.first_name, ' ', u.last_name), 'Mqulima Farmer') AS author,
          COALESCE(pr.avatar_url, '') AS "authorAvatar"
        FROM show_comments sc
        LEFT JOIN profiles pr ON pr.id = sc.user_id
        LEFT JOIN users u ON u.id = sc.user_id
        WHERE sc.post_id = ANY(${postIds})
          AND (sc.status IS NULL OR sc.status IN ('published', 'active'))
        ORDER BY sc.created_at ASC
      `;
      for (const c of dbComments as any[]) {
        const list = commentsByPost.get(c.post_id) || [];
        list.push({
          id: c.id,
          parent_id: c.parent_id,
          parentId: c.parent_id,
          user_id: c.user_id,
          author: c.author,
          text: c.text,
          body: c.text,
          time: c.time,
        });
        commentsByPost.set(c.post_id, list);
      }
    }

    // Check liked/saved for authenticated user
    let likedPostIds = new Set<string>();
    let savedPostIds = new Set<string>();

    if (user && postIds.length > 0) {
      const [likes, bookmarks] = await Promise.all([
        sql`SELECT post_id FROM show_likes WHERE user_id = ${user.id} AND post_id = ANY(${postIds})`,
        sql`SELECT post_id FROM show_bookmarks WHERE user_id = ${user.id} AND post_id = ANY(${postIds})`,
      ]);
      likedPostIds = new Set(likes.map((l: any) => l.post_id));
      savedPostIds = new Set(bookmarks.map((b: any) => b.post_id));
    }

    let items = rows.map((r: any) => {
      const dbComments = commentsByPost.get(r.id) || [];
      const handleStr = String(r.handle || "@mqulima_farmer");
      const loc = extractLocationFromTags(r.tags, r.county);
      return {
        id: r.id,
        userId: r.user_id,
        user_id: r.user_id,
        title: r.title || "",
        text: r.text || "",
        tag: mapTypeToTag(r.type, r.tags),
        county: r.county || "Kenya",
        location: loc,
        author: r.author || "Mqulima Farmer",
        handle: handleStr.startsWith("@") ? handleStr : `@${handleStr}`,
        authorAvatar: r.authorAvatar,
        date: r.date,
        created_at: r.created_at,
        likes: Number(r.likes || 0),
        comments: dbComments,
        commentCount: dbComments.length,
        liked: likedPostIds.has(r.id),
        saved: savedPostIds.has(r.id),
        resolved: false,
        image: (Array.isArray(r.mediaUrls) && r.mediaUrls[0]) || null,
      };
    });

    // Apply tag/category filter
    if (category && category !== "All" && category.trim()) {
      const catLower = category.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.tag.toLowerCase() === catLower ||
          item.tag.toLowerCase().includes(catLower)
      );
    }

    // Apply search query filter
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(term) ||
          item.text.toLowerCase().includes(term) ||
          item.author.toLowerCase().includes(term) ||
          item.county.toLowerCase().includes(term) ||
          item.location.toLowerCase().includes(term) ||
          item.tag.toLowerCase().includes(term)
      );
    }

    // Apply sort filter
    if (sort === "popular") {
      items.sort((a, b) => (b.likes + b.comments.length * 2) - (a.likes + a.comments.length * 2));
    } else if (sort === "unanswered") {
      items = items.filter((item) => item.comments.length === 0);
    } else {
      items.sort(
        (a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
      );
    }

    const total = items.length;
    const offset = (page - 1) * limit;
    const pagedItems = items.slice(offset, offset + limit);
    const nextPage = offset + limit < total ? page + 1 : null;

    // Also fetch real suggestedFarmers, sokoListings, and marketPrices from PostgreSQL
    const [suggestedRows, sokoRows, marketRows] = await Promise.all([
      sql`
        SELECT
          u.id,
          COALESCE(p.username, CONCAT('mqulima_', LOWER(REGEXP_REPLACE(COALESCE(u.first_name, 'farmer'), '[^a-zA-Z0-9]', '', 'g')))) AS username,
          COALESCE(NULLIF(TRIM(p.full_name), ''), TRIM(CONCAT(u.first_name, ' ', u.last_name)), u.email, 'Mqulima Farmer') AS full_name,
          COALESCE(p.country, 'Kenya') AS country,
          COALESCE(NULLIF(TRIM(p.county_region), ''), NULLIF(TRIM(u.county), ''), 'Kenya') AS county_region,
          COALESCE(p.nature_of_agriculture, u.farming_type, 'General Agriculture') AS nature_of_agriculture,
          COALESCE(p.farming_interests, ARRAY[]::text[]) AS farming_interests,
          COALESCE(p.crops, ARRAY[]::text[]) AS crops,
          COALESCE(p.livestock, ARRAY[]::text[]) AS livestock,
          COALESCE(p.years_farming, 0) AS years_farming,
          COALESCE(p.certifications, ARRAY[]::text[]) AS certifications,
          COALESCE(p.reputation_score, 0) AS reputation_score,
          COALESCE(p.followers_count, 0) AS followers_count,
          p.avatar_url,
          p.cover_image,
          p.bio,
          p.website,
          COALESCE(p.phone, u.phone_number, '') AS phone,
          COALESCE(p.email, u.email, '') AS email,
          p.farming_activities,
          COALESCE(p.farming_photos, ARRAY[]::text[]) AS farming_photos,
          COALESCE(p.created_at, u.created_at) AS created_at
        FROM users u
        LEFT JOIN profiles p ON p.id = u.id
        WHERE (p.role IS NULL OR p.role NOT IN ('super_admin', 'admin'))
          AND (p.username IS NULL OR (p.username NOT LIKE '%admin%' AND p.username NOT LIKE '%agent%'))
          AND p.deleted_at IS NULL
        ORDER BY u.created_at ASC NULLS LAST
        LIMIT 100
      `.catch(() => []),
      sql`
        SELECT
          cl.id,
          co.name AS commodity,
          co.unit,
          cl.quantity::float AS quantity,
          cl.asking_price::float AS asking_price,
          cl.location,
          cl.description,
          COALESCE(cl.image_urls, ARRAY[]::text[]) AS image_urls,
          cl.status,
          cl.contact_phone,
          cl.created_at,
          p.username,
          p.full_name,
          p.county_region,
          p.phone AS farmer_phone,
          p.avatar_url
        FROM commodity_listings cl
        JOIN commodities co ON co.id = cl.commodity_id
        JOIN profiles p ON p.id = cl.user_id
        WHERE cl.status = 'active'
        ORDER BY cl.created_at DESC
        LIMIT 24
      `.catch(() => []),
      sql`
        SELECT
          cpb.id,
          co.name AS commodity,
          co.unit,
          cpb.region AS market,
          cpb.price::float AS price,
          cpb.recorded_at
        FROM commodity_price_board cpb
        JOIN commodities co ON co.id = cpb.commodity_id
        ORDER BY cpb.recorded_at DESC
        LIMIT 8
      `.catch(() => []),
    ]);

    const suggestedFarmers = (suggestedRows as any[]).map((row: any) => {
      const name = row.full_name || "Mqulima Farmer";
      const rawUser = row.username || "mqulima_farmer";
      const username = rawUser.startsWith("@") ? rawUser : `@${rawUser}`;
      return {
        id: row.id,
        username,
        name,
        country: row.country || "Kenya",
        county: row.county_region || "Kenya",
        natureOfAgriculture: row.nature_of_agriculture || "General Agriculture",
        interests: Array.isArray(row.farming_interests) ? row.farming_interests : [],
        crops: Array.isArray(row.crops) ? row.crops : [],
        livestock: Array.isArray(row.livestock) ? row.livestock : [],
        yearsFarming: Number(row.years_farming || 0),
        certifications: Array.isArray(row.certifications) ? row.certifications : [],
        reputationScore: Number(row.reputation_score || 0),
        followersCount: Number(row.followers_count || 0),
        avatarUrl:
          row.avatar_url && (row.avatar_url.startsWith("http") || row.avatar_url.startsWith("/"))
            ? row.avatar_url
            : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=1a5438&textColor=ffffff`,
        coverImage: row.cover_image || "",
        bio: row.bio || "",
        website: row.website || "",
        phone: row.phone || "",
        email: row.email || "",
        farmingActivities: row.farming_activities || "",
        farmingPhotos: Array.isArray(row.farming_photos) ? row.farming_photos : [],
        joinedDate: row.created_at ? new Date(row.created_at).toISOString().split("T")[0] : "2026-09-12",
      };
    });

    const sokoListings = (sokoRows as any[]).map((listing: any) => {
      const name = listing.full_name || "Mqulima Farmer";
      const rawUser = listing.username || "mqulima_farmer";
      const username = rawUser.startsWith("@") ? rawUser : `@${rawUser}`;
      return {
        id: listing.id,
        commodity: listing.commodity,
        type: /cow|goat|sheep|poultry|pig|fish|milk|egg|kienyeji|broiler/i.test(listing.commodity)
          ? "livestock"
          : /mango|avocado|banana|orange|passion|fruit|papaya|pineapple/i.test(listing.commodity)
          ? "fruit"
          : "crop",
        price: Number(listing.asking_price || 0),
        quantity: `${listing.quantity} ${listing.unit || "Bags"}`,
        location: listing.location || listing.county_region || "Kenya",
        images: Array.isArray(listing.image_urls) ? listing.image_urls : [],
        description: listing.description || "",
        phone: listing.contact_phone || listing.farmer_phone || "",
        status: listing.status === "sold" ? "sold" : "available",
        createdAt: listing.created_at ? new Date(listing.created_at).toISOString().split("T")[0] : "Recent",
        author: {
          username,
          name,
          county: listing.county_region || "Kenya",
          phone: listing.contact_phone || listing.farmer_phone || "",
          avatarUrl:
            listing.avatar_url && (listing.avatar_url.startsWith("http") || listing.avatar_url.startsWith("/"))
              ? listing.avatar_url
              : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=1a5438&textColor=ffffff`,
        },
      };
    });

    const marketPrices = (marketRows as any[]).map((m: any) => ({
      id: m.id,
      commodity: m.commodity,
      unit: m.unit || "Kg",
      market: m.market || "Kenya",
      price: Number(m.price || 0),
      trend: "up",
      change: "+1.8%",
    }));

    return new Response(
      JSON.stringify({
        success: true,
        items: pagedItems,
        total,
        next_page: nextPage,
        page,
        suggestedFarmers,
        sokoListings,
        marketPrices,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err: any) {
    console.error("[API/V1/FORUM-FEED ERROR]:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || "Failed to fetch forum feed",
        items: [],
        total: 0,
        next_page: null,
        page: 1,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleCreatePost(request: Request): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized. Sign in to post in the forum." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const { title, text, tag = "Farm Progress", county, image } = body;

    if ((!text || text.trim().length < 5) && !image) {
      return new Response(
        JSON.stringify({ success: false, error: "Post content must be at least 5 characters." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sql = getDb();
    const mediaUrls = image ? [image] : [];
    const tags = [tag, ...(county ? [`📍 ${county}`] : [])];
    const typeMap: Record<string, string> = {
      "Harvest Update": "harvest",
      "Success Story": "story",
      "Farming Tips": "tips",
      Question: "question",
      "Farm Progress": "update",
    };
    const postType = typeMap[tag] || "update";

    // Ensure profile exists for user
    try {
      const cleanUser = (user.name || "farmer").toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 15);
      await sql`
        INSERT INTO profiles (id, username, full_name, email, county_region, restriction_status, reputation_score, followers_count)
        VALUES (
          ${user.id},
          ${`mqulima_${cleanUser}`},
          ${user.name || "Mqulima Farmer"},
          ${user.email || null},
          ${county || user.county || "Kenya"},
          'active',
          100,
          0
        )
        ON CONFLICT (id) DO NOTHING
      `;
    } catch {}

    const [post] = await sql`
      INSERT INTO show_posts (
        user_id,
        title,
        caption,
        type,
        tags,
        media_urls,
        status,
        created_at,
        updated_at
      )
      VALUES (
        ${user.id},
        ${title ? title.trim() : ""},
        ${text ? text.trim() : ""},
        ${postType},
        ${tags},
        ${mediaUrls},
        'published',
        NOW(),
        NOW()
      )
      RETURNING id, created_at
    `;

    try {
      invalidateForumSnapshotCache();
    } catch {}

    const createdPost = {
      id: post.id,
      userId: user.id,
      user_id: user.id,
      title: title ? title.trim() : "",
      text: text ? text.trim() : "",
      tag,
      county: county || user.county || "Kenya",
      location: county || user.county || "Kenya",
      author: user.name || "Mqulima Farmer",
      handle: `@mqulima_${(user.name || "farmer").toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      date: post.created_at,
      created_at: post.created_at,
      likes: 0,
      liked: false,
      saved: false,
      resolved: false,
      image: image || null,
      comments: [],
    };

    return new Response(
      JSON.stringify({
        success: true,
        ...createdPost,
        post: createdPost,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[API/V1/CREATE-POST ERROR]:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to create post." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleGetPost(postId: string, request: Request): Promise<Response> {
  try {
    const user = await authenticateRequest(request);
    const sql = getDb();

    const [p] = await sql`
      SELECT
        sp.id,
        sp.user_id,
        sp.type,
        sp.tags,
        COALESCE(sp.title, '') AS title,
        COALESCE(sp.caption, '') AS text,
        sp.media_urls,
        COALESCE(sp.like_count, 0) AS likes,
        sp.created_at,
        COALESCE(pr.full_name, CONCAT(u.first_name, ' ', u.last_name), 'Mqulima Farmer') AS author,
        COALESCE(pr.username, '@mqulima_farmer') AS handle,
        COALESCE(pr.county_region, u.county, 'Kenya') AS county,
        COALESCE(pr.avatar_url, '') AS "authorAvatar"
      FROM show_posts sp
      LEFT JOIN profiles pr ON pr.id = sp.user_id
      LEFT JOIN users u ON u.id = sp.user_id
      WHERE sp.id = ${postId} AND sp.deleted_at IS NULL
      LIMIT 1
    `;

    if (!p) {
      return new Response(
        JSON.stringify({ success: false, error: "Discussion not found." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const comments = await sql`
      SELECT
        sc.id,
        sc.post_id,
        sc.parent_id,
        sc.user_id,
        sc.body AS text,
        sc.created_at AS time,
        COALESCE(pr.full_name, CONCAT(u.first_name, ' ', u.last_name), 'Farmer') AS author,
        COALESCE(pr.avatar_url, '') AS "authorAvatar"
      FROM show_comments sc
      LEFT JOIN profiles pr ON pr.id = sc.user_id
      LEFT JOIN users u ON u.id = sc.user_id
      WHERE sc.post_id = ${postId}
        AND (sc.status IS NULL OR sc.status IN ('published', 'active'))
      ORDER BY sc.created_at ASC
    `;

    let isLiked = false;
    let isSaved = false;

    if (user) {
      const [like, bookmark] = await Promise.all([
        sql`SELECT 1 FROM show_likes WHERE user_id = ${user.id} AND post_id = ${postId} LIMIT 1`,
        sql`SELECT 1 FROM show_bookmarks WHERE user_id = ${user.id} AND post_id = ${postId} LIMIT 1`,
      ]);
      isLiked = like.length > 0;
      isSaved = bookmark.length > 0;
    }

    const mappedComments = comments.map((c: any) => ({
      id: c.id,
      parent_id: c.parent_id,
      parentId: c.parent_id,
      user_id: c.user_id,
      author: c.author,
      text: c.text,
      body: c.text,
      time: c.time,
    }));

    const loc = extractLocationFromTags(p.tags, p.county);

    return new Response(
      JSON.stringify({
        id: p.id,
        userId: p.user_id,
        user_id: p.user_id,
        title: p.title || "",
        text: p.text || "",
        tag: mapTypeToTag(p.type, p.tags),
        author: p.author,
        handle: String(p.handle || "@mqulima_farmer").startsWith("@")
          ? p.handle
          : `@${p.handle}`,
        county: p.county || "Kenya",
        location: loc,
        date: p.created_at,
        created_at: p.created_at,
        likes: Number(p.likes || 0),
        liked: isLiked,
        saved: isSaved,
        resolved: false,
        image: (Array.isArray(p.media_urls) && p.media_urls[0]) || null,
        comments: mappedComments,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleAddComment(postId: string, request: Request): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const json = await request.json();
    const text = (json.text || json.body || "").trim();
    const parentId = json.parentId || json.parent_id || json.parent || null;
    if (!text) {
      return new Response(
        JSON.stringify({ success: false, error: "Comment text cannot be empty." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sql = getDb();
    const [comment] = await sql`
      INSERT INTO show_comments (post_id, parent_id, user_id, body, status, created_at)
      VALUES (${postId}, ${parentId}, ${user.id}, ${text}, 'published', NOW())
      RETURNING id, created_at
    `;

    await sql`
      UPDATE show_posts
      SET comment_count = COALESCE(comment_count, 0) + 1
      WHERE id = ${postId}
    `;

    try {
      invalidateForumSnapshotCache();
    } catch {}

    return new Response(
      JSON.stringify({
        id: comment.id,
        parent_id: parentId,
        parentId: parentId,
        user_id: user.id,
        author: user.name || "Mqulima Farmer",
        text,
        body: text,
        time: comment.created_at,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleToggleLike(postId: string, request: Request): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const sql = getDb();
    const [existing] = await sql`
      SELECT id FROM show_likes WHERE post_id = ${postId} AND user_id = ${user.id} LIMIT 1
    `;

    let liked = false;
    if (existing) {
      await sql`DELETE FROM show_likes WHERE id = ${existing.id}`;
      await sql`UPDATE show_posts SET like_count = GREATEST(0, COALESCE(like_count, 1) - 1) WHERE id = ${postId}`;
      liked = false;
    } else {
      await sql`INSERT INTO show_likes (post_id, user_id) VALUES (${postId}, ${user.id})`;
      await sql`UPDATE show_posts SET like_count = COALESCE(like_count, 0) + 1 WHERE id = ${postId}`;
      liked = true;
    }

    const [p] = await sql`SELECT COALESCE(like_count, 0) as count FROM show_posts WHERE id = ${postId}`;

    try {
      invalidateForumSnapshotCache();
    } catch {}

    return new Response(
      JSON.stringify({ success: true, liked, likes: p?.count || 0 }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleBookmarkPost(postId: string, request: Request): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const sql = getDb();
    const [existing] = await sql`
      SELECT id FROM show_bookmarks WHERE post_id = ${postId} AND user_id = ${user.id} LIMIT 1
    `;

    let saved = false;
    if (existing) {
      if (body.saved === true) {
        saved = true;
      } else {
        await sql`DELETE FROM show_bookmarks WHERE id = ${existing.id}`;
        saved = false;
      }
    } else {
      if (body.saved === false) {
        saved = false;
      } else {
        await sql`INSERT INTO show_bookmarks (post_id, user_id) VALUES (${postId}, ${user.id})`;
        saved = true;
      }
    }

    try {
      invalidateForumSnapshotCache();
    } catch {}

    return new Response(
      JSON.stringify({ success: true, saved }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleCreateSokoListing(request: Request): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized. Please sign in to publish a commodity listing." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const commodityName = String(body.commodityName || body.commodity || "").trim();
    const type = body.type || "crop";
    const price = Number(body.price || 0);
    const quantity = String(body.quantity || "").trim();
    const location = String(body.location || user.county || "Kenya").trim();
    const description = String(body.description || "Verified community listing.").trim();
    const images = Array.isArray(body.images) ? body.images : body.image ? [body.image] : [];
    const phone = String(body.phone || "").trim();

    if (!commodityName || price <= 0 || !quantity) {
      return new Response(
        JSON.stringify({ success: false, error: "Commodity name, price, and quantity are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sql = getDb();

    // Ensure profile exists for user
    try {
      const cleanUser = (user.name || "farmer").toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 15);
      await sql`
        INSERT INTO profiles (id, username, full_name, email, county_region, restriction_status, reputation_score, followers_count)
        VALUES (
          ${user.id},
          ${`mqulima_${cleanUser}`},
          ${user.name || "Mqulima Farmer"},
          ${user.email || null},
          ${location || user.county || "Kenya"},
          'active',
          100,
          0
        )
        ON CONFLICT (id) DO NOTHING
      `;
    } catch {}

    let [commodity] = await sql`
      SELECT id, unit FROM commodities WHERE LOWER(name) = ${commodityName.toLowerCase()} LIMIT 1
    `;
    const qtyParts = quantity.split(" ");
    const qtyVal = parseFloat(qtyParts[0]) || 1;
    const unitVal = qtyParts.slice(1).join(" ") || "Bags";

    if (!commodity) {
      let catId: string | null = null;
      try {
        const searchPattern = type === "crop" ? "%crop%" : type === "fruit" ? "%fruit%" : "%livestock%";
        const [category] = await sql`
          SELECT id FROM product_categories WHERE name ILIKE ${searchPattern} LIMIT 1
        `;
        catId = category?.id || null;
      } catch {}

      [commodity] = await sql`
        INSERT INTO commodities (name, unit, category_id)
        VALUES (${commodityName}, ${unitVal}, ${catId})
        RETURNING id, unit
      `;
    }

    const [created] = await sql`
      INSERT INTO commodity_listings (user_id, commodity_id, quantity, asking_price, location, description, image_urls, contact_phone, status)
      VALUES (
        ${user.id},
        ${commodity.id},
        ${qtyVal},
        ${price},
        ${location},
        ${description},
        ${images},
        ${phone || null},
        'active'
      )
      RETURNING id, created_at
    `;

    try {
      invalidateForumSnapshotCache();
    } catch {}

    return new Response(
      JSON.stringify({
        success: true,
        listing: {
          id: created.id,
          commodity: commodityName,
          type,
          price,
          quantity,
          location,
          images,
          description,
          phone,
          status: "available",
          createdAt: "Just now",
          author: {
            username: `@mqulima_${(user.name || "farmer").toLowerCase().replace(/[^a-z0-9]/g, "")}`,
            name: user.name || "Mqulima Farmer",
            county: location,
            phone,
          },
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to publish listing." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleSubmitConsultation(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const name = String(body.name || "Farmer Client").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "farmer@mqulima.com").trim();
    const county = String(body.county || "Uasin Gishu").trim();
    const specialty = String(body.specialty || "Crop & Soil Agronomy").trim();
    const channel = String(body.channel || "whatsapp").trim();
    const urgency = String(body.urgency || "normal").trim();
    const message = String(body.message || "").trim();

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Phone number and inquiry details are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sql = getDb();
    const formattedSubject = `[Consultation - ${urgency.toUpperCase()}] ${specialty} (${county})`;
    const formattedUserType = `Farmer Client (${channel.toUpperCase()} Desk)`;
    const formattedMessage = `Subject: ${formattedSubject}\nUser Type: ${formattedUserType}\nPhone: ${phone}\n\nMessage:\nSpecialty: ${specialty}\nCounty: ${county}\nUrgency: ${urgency.toUpperCase()}\nPreferred Contact Method: ${channel}\n\nFarmer Inquiry Details:\n${message}`;

    const [submission] = await sql`
      INSERT INTO contact_submissions (name, email, message)
      VALUES (${name}, ${email || "farmer@mqulima.com"}, ${formattedMessage})
      RETURNING id, created_at
    `;

    const ticketId = `MQ-CONSULT-${String(submission?.id || Math.floor(100000 + Math.random() * 900000)).substring(0, 8).toUpperCase()}`;
    const assignedConsultant = specialty.includes("Livestock") || specialty.includes("Vet")
      ? "Mqulima Veterinary Extension Desk"
      : specialty.includes("Irrigation")
      ? "Mqulima Irrigation Engineering Team"
      : "Mqulima Senior Agronomy Helpdesk";

    return new Response(
      JSON.stringify({
        success: true,
        ticketId,
        ticket: {
          id: ticketId,
          name,
          phone,
          email,
          county,
          specialty,
          channel,
          urgency,
          message,
          assignedConsultant,
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to submit consultation." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleGetDirectMessages(request: Request, url: URL): Promise<Response> {
  const currentUser = await authenticateRequest(request);
  if (!currentUser) {
    return new Response(
      JSON.stringify({ success: true, conversations: [], messages: [] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const sql = getDb();
    const otherUsername = url.searchParams.get("otherUsername") || "";
    let messages: any[] = [];
    let otherUser: any = null;

    if (otherUsername) {
      const cleanUsername = otherUsername.replace(/^@/, "").trim().toLowerCase();
      const [foundUser] = await sql`
        SELECT id, username, full_name FROM profiles
        WHERE (
          LOWER(REPLACE(username, '@', '')) = ${cleanUsername}
          OR LOWER(email) = ${cleanUsername}
          OR id::text = ${cleanUsername}
        )
        AND deleted_at IS NULL
        LIMIT 1
      `;
      otherUser = foundUser;

      if (otherUser) {
        const rawMsgs = await sql`
          SELECT
            m.id,
            m.sender_id,
            m.recipient_id,
            m.body,
            m.image_url,
            m.is_read,
            m.created_at,
            sp.username AS sender_username
          FROM direct_messages m
          LEFT JOIN profiles sp ON sp.id = m.sender_id
          WHERE (m.sender_id = ${currentUser.id} AND m.recipient_id = ${otherUser.id})
             OR (m.sender_id = ${otherUser.id} AND m.recipient_id = ${currentUser.id})
          ORDER BY m.created_at ASC
        `;

        messages = rawMsgs.map((m: any) => ({
          id: m.id,
          sender: m.sender_username?.startsWith("@") ? m.sender_username : `@${m.sender_username || "farmer"}`,
          senderId: m.sender_id,
          isMe: m.sender_id === currentUser.id,
          text: m.body,
          image: m.image_url,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          read: m.is_read,
        }));

        await sql`
          UPDATE direct_messages
          SET is_read = TRUE
          WHERE sender_id = ${otherUser.id} AND recipient_id = ${currentUser.id} AND is_read = FALSE
        `;
      }
    }

    const conversationPartners = await sql`
      SELECT DISTINCT
        p.id,
        p.username,
        p.full_name,
        p.county_region,
        p.avatar_url,
        (
          SELECT m.body FROM direct_messages m
          WHERE (m.sender_id = ${currentUser.id} AND m.recipient_id = p.id)
             OR (m.sender_id = p.id AND m.recipient_id = ${currentUser.id})
          ORDER BY m.created_at DESC LIMIT 1
        ) AS last_message,
        (
          SELECT m.created_at FROM direct_messages m
          WHERE (m.sender_id = ${currentUser.id} AND m.recipient_id = p.id)
             OR (m.sender_id = p.id AND m.recipient_id = ${currentUser.id})
          ORDER BY m.created_at DESC LIMIT 1
        ) AS last_message_at,
        (
          SELECT COUNT(*)::int FROM direct_messages m
          WHERE m.sender_id = p.id AND m.recipient_id = ${currentUser.id} AND m.is_read = FALSE
        ) AS unread_count
      FROM profiles p
      WHERE p.id IN (
        SELECT recipient_id FROM direct_messages WHERE sender_id = ${currentUser.id}
        UNION
        SELECT sender_id FROM direct_messages WHERE recipient_id = ${currentUser.id}
      )
      AND p.deleted_at IS NULL
      ORDER BY last_message_at DESC NULLS LAST
    `;

    const conversations = conversationPartners.map((p: any) => ({
      id: `dm_${p.id}`,
      name: p.full_name || p.username || "Farmer Partner",
      unreadCount: p.unread_count || 0,
      lastMessage: p.last_message || "",
      lastMessageTime: p.last_message_at
        ? new Date(p.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "",
      farmer: {
        id: p.id,
        username: p.username?.startsWith("@") ? p.username : `@${p.username || "farmer"}`,
        name: p.full_name || "Mqulima Farmer",
        county: p.county_region || "Kenya",
        avatarUrl:
          p.avatar_url ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.full_name || "Farmer")}&backgroundColor=1a5438&textColor=ffffff`,
      },
    }));

    return new Response(
      JSON.stringify({ success: true, conversations, messages }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message, conversations: [], messages: [] }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleSendDirectMessage(request: Request): Promise<Response> {
  const currentUser = await authenticateRequest(request);
  if (!currentUser) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized: Please sign in to send messages." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const data = await request.json();
    const recipientUsername = String(data.recipientUsername || "").replace(/^@/, "").trim().toLowerCase();
    const body = String(data.body || data.text || "").trim();
    const imageUrl = data.imageUrl || null;

    if (!recipientUsername || (!body && !imageUrl)) {
      return new Response(
        JSON.stringify({ success: false, error: "Recipient and message body are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sql = getDb();
    const [recipient] = await sql`
      SELECT id, username, full_name FROM profiles
      WHERE (
        LOWER(REPLACE(username, '@', '')) = ${recipientUsername}
        OR LOWER(email) = ${recipientUsername}
        OR id::text = ${recipientUsername}
      )
      AND deleted_at IS NULL
      LIMIT 1
    `;

    if (!recipient) {
      return new Response(
        JSON.stringify({ success: false, error: `Farmer @${recipientUsername} was not found.` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (recipient.id === currentUser.id) {
      return new Response(
        JSON.stringify({ success: false, error: "You cannot send a message to yourself." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const [msg] = await sql`
      INSERT INTO direct_messages (sender_id, recipient_id, body, image_url)
      VALUES (${currentUser.id}, ${recipient.id}, ${body}, ${imageUrl})
      RETURNING id, sender_id, recipient_id, body, image_url, is_read, created_at
    `;

    const [senderProfile] = await sql`
      SELECT username, full_name FROM profiles WHERE id = ${currentUser.id} LIMIT 1
    `;
    const senderHandle = senderProfile?.username
      ? senderProfile.username.startsWith("@")
        ? senderProfile.username
        : `@${senderProfile.username}`
      : `@mqulima_${(currentUser.name || "farmer").toLowerCase().replace(/[^a-z0-9]/g, "")}`;

    return new Response(
      JSON.stringify({
        success: true,
        message: {
          id: msg.id,
          sender: senderHandle,
          senderId: currentUser.id,
          isMe: true,
          text: msg.body,
          image: msg.image_url,
          timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          read: msg.is_read,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to send message." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
