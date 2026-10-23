import { getDb } from "../db.server";
import { authenticateRequest } from "./auth-helper";
import { invalidateForumSnapshotCache } from "../api/community.server";

const VALID_POST_TYPES = new Set(["harvest", "story", "tragedy", "learning", "moment"]);

export async function handleForumFeed(request: Request, url: URL): Promise<Response> {
  try {
    const user = await authenticateRequest(request);
    const category = url.searchParams.get("tag") || url.searchParams.get("category") || "All";
    const q = url.searchParams.get("q") || "";
    const scope = url.searchParams.get("scope") || "all";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "15", 10)));
    const offset = (page - 1) * limit;

    const sql = getDb();
    let whereClause = sql`sp.deleted_at IS NULL`;

    if (category && category !== "All" && category.trim()) {
      whereClause = sql`${whereClause} AND (sp.category ILIKE ${category} OR sp.tags @> ARRAY[${category}])`;
    }
    if (q.trim()) {
      const term = `%${q.trim()}%`;
      whereClause = sql`${whereClause} AND (sp.title ILIKE ${term} OR sp.caption ILIKE ${term})`;
    }
    if (scope === "mine" && user) {
      whereClause = sql`${whereClause} AND sp.user_id = ${user.id}`;
    }

    const [rows, countRes] = await Promise.all([
      sql`
        SELECT
          sp.id,
          sp.user_id,
          COALESCE(sp.category, sp.type, 'General') AS tag,
          COALESCE(sp.title, 'Farm discussion') AS title,
          sp.caption AS text,
          sp.media_urls AS "mediaUrls",
          COALESCE(sp.like_count, 0) AS likes,
          COALESCE(sp.comment_count, 0) AS "commentCount",
          COALESCE(sp.tags, ARRAY[]::text[]) AS tags,
          sp.created_at AS date,
          sp.created_at AS created_at,
          COALESCE(p.username, CONCAT('@farmer_', LOWER(SUBSTRING(COALESCE(u.first_name, 'user'), 1, 6)))) AS handle,
          COALESCE(p.full_name, CONCAT(u.first_name, ' ', u.last_name), 'Mqulima Farmer') AS author,
          COALESCE(p.county_region, u.county, 'Kenya') AS county,
          COALESCE(p.avatar_url, '') AS "authorAvatar"
        FROM show_posts sp
        LEFT JOIN profiles p ON p.id = sp.user_id
        LEFT JOIN users u ON u.id = sp.user_id
        WHERE ${whereClause}
        ORDER BY sp.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*)::int as count
        FROM show_posts sp
        WHERE ${whereClause}
      `,
    ]);

    const total = countRes[0]?.count || 0;
    const nextPage = (offset + limit < total) ? page + 1 : null;

    // Check liked/saved for authenticated user
    let likedPostIds = new Set<string>();
    let savedPostIds = new Set<string>();

    if (user) {
      const postIds = rows.map((r: any) => r.id);
      if (postIds.length > 0) {
        const [likes, bookmarks] = await Promise.all([
          sql`SELECT post_id FROM show_likes WHERE user_id = ${user.id} AND post_id = ANY(${postIds})`,
          sql`SELECT post_id FROM show_bookmarks WHERE user_id = ${user.id} AND post_id = ANY(${postIds})`,
        ]);
        likedPostIds = new Set(likes.map((l: any) => l.post_id));
        savedPostIds = new Set(bookmarks.map((b: any) => b.post_id));
      }
    }

    const items = rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      text: r.text,
      tag: r.tag || "General",
      county: r.county || "Kenya",
      author: r.author,
      handle: r.handle,
      authorAvatar: r.authorAvatar,
      date: r.date,
      created_at: r.created_at,
      likes: r.likes,
      comments: r.commentCount,
      liked: likedPostIds.has(r.id),
      saved: savedPostIds.has(r.id),
      image: (Array.isArray(r.mediaUrls) && r.mediaUrls[0]) || null,
    }));

    return new Response(
      JSON.stringify({ success: true, items, total, next_page: nextPage, page }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=15, s-maxage=30",
        },
      }
    );
  } catch (err: any) {
    console.error("[API/V1/FORUM-FEED ERROR]:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to load discussions." }),
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
    const { title, text, tag = "General", county, image } = body;

    if (!text || text.trim().length < 5) {
      return new Response(
        JSON.stringify({ success: false, error: "Post content must be at least 5 characters." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sql = getDb();
    const mediaUrls = image ? [image] : [];
    const tags = [tag];
    const postType = VALID_POST_TYPES.has(tag.toLowerCase()) ? tag.toLowerCase() : "moment";

    const [post] = await sql`
      INSERT INTO show_posts (
        user_id,
        author_id,
        title,
        caption,
        category,
        type,
        tags,
        media_urls,
        created_at,
        updated_at
      )
      VALUES (
        ${user.id},
        ${user.id},
        ${title ? title.trim() : "Farm Discussion"},
        ${text.trim()},
        ${tag},
        ${postType},
        ${tags},
        ${mediaUrls},
        NOW(),
        NOW()
      )
      RETURNING id, created_at
    `;

    // Invalidate cached snapshots on web portal
    try {
      invalidateForumSnapshotCache();
    } catch {}

    return new Response(
      JSON.stringify({
        success: true,
        post: {
          id: post.id,
          title: title || "Farm Discussion",
          text: text.trim(),
          tag,
          county: county || user.county,
          author: user.name,
          date: post.created_at,
          likes: 0,
          liked: false,
          saved: false,
          comments: [],
        },
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
        sp.id, sp.user_id, COALESCE(sp.category, sp.type, 'General') AS tag, 
        COALESCE(sp.title, 'Farm discussion') AS title,
        sp.caption AS text, sp.media_urls, COALESCE(sp.like_count, 0) AS likes,
        sp.created_at,
        COALESCE(pr.full_name, 'Mqulima Farmer') AS author,
        COALESCE(pr.county_region, 'Kenya') AS county,
        COALESCE(pr.avatar_url, '') AS "authorAvatar"
      FROM show_posts sp
      LEFT JOIN profiles pr ON pr.id = sp.user_id
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
        sc.id, sc.post_id, sc.parent_id, sc.user_id, sc.body AS text, sc.created_at AS time,
        COALESCE(pr.full_name, 'Farmer') AS author,
        COALESCE(pr.avatar_url, '') AS "authorAvatar"
      FROM show_comments sc
      LEFT JOIN profiles pr ON pr.id = sc.user_id
      WHERE sc.post_id = ${postId}
      ORDER BY sc.created_at ASC
    `;

    let isLiked = false;
    let isSaved = false;

    if (user) {
      const [like, bookmark] = await Promise.all([
        sql`SELECT 1 FROM show_likes WHERE user_id = ${user.id} AND post_id = ${postId} LIMIT 1`,
        sql`SELECT 1 FROM show_bookmarks WHERE user_id = ${user.id} AND post_id = ${postId} LIMIT 1`,
      ]);
      isLiked = Boolean(like);
      isSaved = Boolean(bookmark);
    }

    return new Response(
      JSON.stringify({
        id: p.id,
        title: p.title,
        text: p.text,
        tag: p.tag || "General",
        author: p.author,
        county: p.county,
        date: p.created_at,
        likes: p.likes,
        liked: isLiked,
        saved: isSaved,
        comments: comments.map((c: any) => ({
          id: c.id,
          parent_id: c.parent_id,
          parentId: c.parent_id,
          author: c.author,
          text: c.text,
          body: c.text,
          time: c.time,
        })),
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
      INSERT INTO show_comments (post_id, parent_id, user_id, body, created_at)
      VALUES (${postId}, ${parentId}, ${user.id}, ${text}, NOW())
      RETURNING id, created_at
    `;

    // Increment comment count on post
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
        author: user.name,
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
