import { createServerFn } from "@tanstack/react-start";

function resolveAvatar(avatarUrl: string | null, name: string) {
  if (avatarUrl && (avatarUrl.startsWith("http") || avatarUrl.startsWith("data:"))) {
    return avatarUrl;
  }
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=1a5438&textColor=ffffff`;
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
        COALESCE(p.username, CONCAT('@mqulima_', LOWER(REGEXP_REPLACE(COALESCE(u.first_name, 'farmer'), '[^a-[#a-zA-Z0-9]', '', 'g')))) AS username,
        COALESCE(p.full_name, CONCAT(u.first_name, ' ', u.last_name), u.email, 'Mqulima Farmer') AS full_name,
        COALESCE(p.country, 'Kenya') AS country,
        COALESCE(p.county_region, u.county, 'Kenya') AS county_region,
        p.farming_interests,
        p.crops,
        p.livestock,
        p.years_farming,
        p.certifications,
        p.reputation_score,
        p.followers_count,
        p.avatar_url,
        p.bio,
        p.website,
        p.phone,
        COALESCE(p.email, u.email) AS email,
        p.farming_activities,
        p.farming_photos,
        p.created_at AS profile_created_at
      FROM show_posts sp
      LEFT JOIN profiles p ON p.id = sp.user_id
      LEFT JOIN users u ON u.id = sp.user_id
      WHERE (sp.status IS NULL OR sp.status IN ('published', 'active'))
      ORDER BY sp.created_at DESC
      LIMIT 50
    `;

    const { getCurrentUser } = await import("../auth-server");
    const currentUser = await getCurrentUser().catch(() => null);

    let userLikedPostIds = new Set<string>();
    let userSavedPostIds = new Set<string>();

    if (currentUser) {
      const likedRows = await sql`
        SELECT post_id FROM show_likes WHERE user_id = ${currentUser.id}
      `;
      likedRows.forEach((r: any) => userLikedPostIds.add(r.post_id));

      const savedRows = await sql`
        SELECT post_id FROM show_bookmarks WHERE user_id = ${currentUser.id}
      `;
      savedRows.forEach((r: any) => userSavedPostIds.add(r.post_id));
    }

    const comments = posts.length > 0
      ? await sql`
          SELECT
            sc.id,
            sc.post_id,
            sc.parent_id,
            sc.body,
            sc.created_at,
            sc.user_id,
            COALESCE(p.username, CONCAT('@mqulima_', LOWER(REGEXP_REPLACE(COALESCE(u.first_name, 'farmer'), '[^a-zA-Z0-9]', '', 'g')))) AS username,
            COALESCE(p.full_name, CONCAT(u.first_name, ' ', u.last_name), u.email, 'Mqulima Farmer') AS full_name,
            p.avatar_url
          FROM show_comments sc
          LEFT JOIN profiles p ON p.id = sc.user_id
          LEFT JOIN users u ON u.id = sc.user_id
          WHERE (sc.status IS NULL OR sc.status IN ('published', 'active')) AND sc.post_id IN ${sql(posts.map((post: any) => post.id))}
          ORDER BY sc.created_at ASC
          LIMIT 250
        `.catch(() => [])
      : [];

    const commentsByPost = new Map<string, any[]>();
    for (const comment of comments as any[]) {
      const list = commentsByPost.get(comment.post_id) || [];
      const authorName = comment.full_name || comment.username || "Mqulima Farmer";
      list.push({
        id: comment.id,
        parentId: comment.parent_id || null,
        userId: comment.user_id,
        authorName,
        authorUsername: comment.username ? (comment.username.startsWith("@") ? comment.username : `@${comment.username}`) : "@mqulima_farmer",
        authorAvatar: resolveAvatar(comment.avatar_url, authorName),
        text: comment.body,
        time: new Date(comment.created_at).toLocaleDateString(),
        createdAt: comment.created_at ? new Date(comment.created_at).toISOString() : new Date().toISOString()
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
        cl.contact_phone,
        cl.created_at,
        p.username,
        p.full_name,
        p.phone AS farmer_phone,
        p.phone,
        p.email,
        p.farming_activities,
        p.farming_photos,
        p.country,
        p.county_region,
        p.farming_interests,
        p.crops,
        p.livestock,
        p.years_farming,
        p.certifications,
        p.reputation_score,
        p.followers_count,
        p.avatar_url,
        p.bio,
        p.website,
        p.created_at AS profile_created_at
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

    const suggestedProfiles = await sql`
      SELECT
        p.username,
        p.full_name,
        p.country,
        p.county_region,
        COALESCE(p.nature_of_agriculture, u.farming_type) AS nature_of_agriculture,
        p.farming_interests,
        p.crops,
        p.livestock,
        p.years_farming,
        p.certifications,
        p.reputation_score,
        p.followers_count,
        p.avatar_url,
        p.cover_image,
        p.bio,
        p.website,
        p.phone,
        p.email,
        p.farming_activities,
        p.farming_photos,
        p.created_at
      FROM profiles p
      LEFT JOIN users u ON u.id = p.id
      WHERE (p.role IS NULL OR p.role NOT IN ('super_admin'))
        AND (p.username IS NULL OR (p.username NOT LIKE '%admin%' AND p.username NOT LIKE '%agent%'))
      ORDER BY p.created_at DESC, p.reputation_score DESC
      LIMIT 100
    `;

    const toFarmer = (row: any) => ({
      username: row.username?.startsWith("@") ? row.username : `@${row.username || "mqulima_farmer"}`,
      name: row.full_name || "Mqulima Farmer",
      country: row.country || "Kenya",
      county: row.county_region || "Kenya",
      natureOfAgriculture: row.nature_of_agriculture || row.farming_type || "",
      interests: row.farming_interests || [],
      crops: row.crops || [],
      livestock: row.livestock || [],
      yearsFarming: row.years_farming || 0,
      certifications: row.certifications || [],
      reputationScore: row.reputation_score || 0,
      followersCount: row.followers_count || 0,
      followers: [],
      avatarUrl: resolveAvatar(row.avatar_url, row.full_name || row.username || "Mqulima Farmer"),
      coverImage: row.cover_image || "",
      bio: row.bio || "",
      website: row.website || "",
      phone: row.phone || "",
      email: row.email || "",
      farmingActivities: row.farming_activities || "",
      farmingPhotos: row.farming_photos || [],
      joinedDate: (row.profile_created_at || row.created_at)
        ? new Date(row.profile_created_at || row.created_at).toISOString().split("T")[0]
        : "2024-01-01"
    });

    const typeToCategoryMap: Record<string, string> = {
      harvest: "Harvest Update",
      story: "Success Story",
      tips: "Farming Tips",
      question: "Question",
      update: "Farm Progress",
      tragedy: "Question",
      learning: "Farming Tips"
    };

    return {
      showPosts: posts.map((post: any) => ({
        id: post.id,
        author: toFarmer(post),
        title: post.title || "Untitled discussion",
        body: post.caption || "",
        type: post.type === "harvest" ? "gallery" : post.type === "story" ? "story" : "update",
        category: typeToCategoryMap[post.type] || "Farm Progress",
        images: post.media_urls || [],
        likes: post.like_count || 0,
        relates: post.relate_count || 0,
        hasLiked: userLikedPostIds.has(post.id),
        hasSaved: userSavedPostIds.has(post.id),
        comments: commentsByPost.get(post.id) || [],
        tags: normalizeTags(post.tags),
        createdAt: post.created_at ? new Date(post.created_at).toISOString().split("T")[0] : "2024-01-01",
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
        phone: listing.contact_phone || listing.farmer_phone || "",
        status: listing.status === "sold" ? "sold" : "available",
        createdAt: listing.created_at ? new Date(listing.created_at).toISOString().split("T")[0] : "2024-01-01",
      })),
      pulsePosts: pulse.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.body,
        category: item.category || "Agronomy Alert",
        source: item.source_url,
        date: item.published_at ? new Date(item.published_at).toISOString().split("T")[0] : "2024-01-01",
      })),
      suggestedFarmers: suggestedProfiles.map(toFarmer),
    };
  });

import { z } from "zod";

export const getCurrentFarmerProfile = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user) return null;

    const { getDb } = await import("../db.server");
    const sql = getDb();
    const [profile] = await sql`
      SELECT
        p.username,
        p.full_name,
        p.country,
        p.county_region,
        COALESCE(p.nature_of_agriculture, u.farming_type) AS nature_of_agriculture,
        p.farming_interests,
        p.crops,
        p.livestock,
        p.years_farming,
        p.certifications,
        p.reputation_score,
        p.followers_count,
        p.avatar_url,
        p.cover_image,
        p.bio,
        p.website,
        p.phone,
        p.email,
        p.farming_activities,
        p.farming_photos,
        p.created_at
      FROM profiles p
      LEFT JOIN users u ON u.id = p.id
      WHERE p.id = ${user.id}
    `;
    if (!profile) {
      return {
        username: `@${(user.name || "farmer").toLowerCase().replace(/\s+/g, "_")}`,
        name: user.name || "Mqulima Farmer",
        country: "Kenya",
        county: user.county || "Kenya",
        natureOfAgriculture: "",
        interests: [],
        crops: user.crops ? user.crops.split(",").map((s: string) => s.trim()) : [],
        livestock: user.livestock ? user.livestock.split(",").map((s: string) => s.trim()) : [],
        yearsFarming: 0,
        certifications: [],
        reputationScore: 0,
        followersCount: 0,
        followers: [],
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || "Farmer")}&backgroundColor=1a5438&textColor=ffffff`,
        coverImage: "",
        bio: "",
        website: "",
        phone: "",
        email: user.email || "",
        farmingActivities: "",
        farmingPhotos: [],
        joinedDate: "2024-01-01"
      };
    }

    return {
      username: profile.username?.startsWith("@") ? profile.username : `@${profile.username || "mqulima_farmer"}`,
      name: profile.full_name || "Mqulima Farmer",
      country: profile.country || "Kenya",
      county: profile.county_region || "Kenya",
      natureOfAgriculture: profile.nature_of_agriculture || "",
      interests: profile.farming_interests || [],
      crops: profile.crops || [],
      livestock: profile.livestock || [],
      yearsFarming: profile.years_farming || 0,
      certifications: profile.certifications || [],
      reputationScore: profile.reputation_score || 0,
      followersCount: profile.followers_count || 0,
      followers: [],
      avatarUrl: resolveAvatar(profile.avatar_url, profile.full_name || profile.username || "Mqulima Farmer"),
      coverImage: profile.cover_image || "",
      bio: profile.bio || "",
      website: profile.website || "",
      phone: profile.phone || "",
      email: profile.email || "",
      farmingActivities: profile.farming_activities || "",
      farmingPhotos: profile.farming_photos || [],
      joinedDate: profile.created_at
        ? new Date(profile.created_at).toISOString().split("T")[0]
        : "2024-01-01"
    };
  });

export const updateFarmerProfile = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    name: z.string().min(1),
    username: z.string().min(1),
    county: z.string(),
    bio: z.string().optional(),
    website: z.string().optional(),
    avatarUrl: z.string().optional(),
    coverImage: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    crops: z.array(z.string()).optional(),
    livestock: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    farmingActivities: z.string().optional(),
    farmingPhotos: z.array(z.string()).optional(),
    csrfToken: z.string(),
  }))
  .handler(async ({ data }) => {
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(data.csrfToken);

    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    let username = data.username.trim().toLowerCase();
    if (username.startsWith("@")) username = username.slice(1);
    if (!username.startsWith("mqulima_")) {
      username = username.startsWith("mqulima") ? "mqulima_" + username.slice(7) : "mqulima_" + username;
    }

    const { getDb } = await import("../db.server");
    const sql = getDb();

    const [existing] = await sql`
      SELECT id FROM profiles WHERE username = ${username} AND id != ${user.id}
    `;
    if (existing) {
      throw new Error("Username already taken. Usernames must start with 'mqulima_'.");
    }

    await sql.begin(async (sql) => {
      await sql`
        UPDATE profiles
        SET
          full_name = ${data.name.trim()},
          username = ${username},
          county_region = ${data.county.trim()},
          bio = ${data.bio || null},
          website = ${data.website || null},
          avatar_url = ${data.avatarUrl || null},
          cover_image = ${data.coverImage || null},
          phone = ${data.phone || null},
          email = ${data.email ? data.email.trim() : user.email},
          crops = ${data.crops || []},
          livestock = ${data.livestock || []},
          farming_interests = ${data.interests || []},
          farming_activities = ${data.farmingActivities || null},
          farming_photos = ${data.farmingPhotos || []},
          updated_at = NOW()
        WHERE id = ${user.id}
      `;

      const [userRow] = await sql`SELECT id FROM users WHERE id = ${user.id}`;
      if (userRow) {
        const names = data.name.trim().split(/\s+/);
        const firstName = names[0] || "";
        const lastName = names.slice(1).join(" ") || "";
        await sql`
          UPDATE users
          SET
            first_name = ${firstName},
            last_name = ${lastName},
            phone_number = ${data.phone || null},
            email = ${data.email ? data.email.trim() : user.email},
            county = ${data.county.trim()}
          WHERE id = ${user.id}
        `;
      }
    });

    return { success: true, username: `@${username}` };
  });

async function autoModeratePostOrComment(
  sql: any,
  userId: string,
  contentType: "post" | "comment",
  textToCheck: string
) {
  let settings: any = null;
  try {
    const [row] = await sql`SELECT * FROM moderation_settings LIMIT 1`;
    settings = row;
  } catch (err) {
    console.error("Failed to query moderation settings:", err);
  }

  if (!settings) {
    return { status: "published", flaggedReason: null };
  }

  // 1. Offensive & Scam Word Blacklist Check
  if (settings.offensive_words_list && settings.offensive_words_list.length > 0) {
    const textLower = textToCheck.toLowerCase();
    
    // Agricultural false-positives whitelist for moderation (e.g., "weed control", "weed management", "weeding", "weed killer", "weeded")
    const agriWhitelistedText = textLower
      .replace(/\bweed\s+(control|management|killer|barrier|free|removal|suppression|growth|ing|ed|s)\b/gi, "agri_term")
      .replace(/\b(weeding|weeded|weeds)\b/gi, "agri_term");

    for (const word of settings.offensive_words_list) {
      if (word && word.trim()) {
        const cleanWord = word.trim().toLowerCase();
        // Regex word boundary matching for precise word checks
        const wordRegex = new RegExp(`\\b${cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (wordRegex.test(agriWhitelistedText)) {
          return {
            status: "flagged",
            flaggedReason: `Content contains forbidden word: "${cleanWord}"`
          };
        }
      }
    }
  }

  // 2. Block External URL Links Check
  if (settings.block_external_links) {
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|org|net|xyz|info|co|io)\b)/gi;
    if (urlPattern.test(textToCheck)) {
      return {
        status: "flagged",
        flaggedReason: "External URLs or untrusted links are restricted on the forum."
      };
    }
  }

  // 3. Automated Spam Detection Check
  if (settings.spam_detection_enabled) {
    const mins = settings.repeated_posts_window_mins || 5;
    if (contentType === "post") {
      const [recentDuplicate] = await sql`
        SELECT id FROM show_posts
        WHERE user_id = ${userId}
          AND caption = ${textToCheck}
          AND created_at >= NOW() - CAST(${mins} || ' minutes' AS INTERVAL)
        LIMIT 1
      `;
      if (recentDuplicate) {
        return {
          status: "flagged",
          flaggedReason: `Duplicate post submitted within ${mins} minute window.`
        };
      }

      // Check rapid bot submissions (> 3 posts in 1 minute)
      const [rapidCountRow] = await sql`
        SELECT COUNT(*)::int AS count FROM show_posts
        WHERE user_id = ${userId} AND created_at >= NOW() - INTERVAL '1 minute'
      `;
      if (rapidCountRow && rapidCountRow.count >= 3) {
        return {
          status: "flagged",
          flaggedReason: "Rapid automated posting detected (spam rate limit)."
        };
      }
    } else {
      const [recentComment] = await sql`
        SELECT id FROM show_comments
        WHERE user_id = ${userId}
          AND body = ${textToCheck}
          AND created_at >= NOW() - CAST(${mins} || ' minutes' AS INTERVAL)
        LIMIT 1
      `;
      if (recentComment) {
        return {
          status: "flagged",
          flaggedReason: `Duplicate comment submitted within ${mins} minute window.`
        };
      }
    }
  }

  return { status: "published", flaggedReason: null };
}

export const createCommunityPost = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    category: z.string(),
    images: z.array(z.string()),
    tags: z.array(z.string()),
    csrfToken: z.string(),
  }))
  .handler(async ({ data }) => {
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(data.csrfToken);

    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const { getDb } = await import("../db.server");
    const sql = getDb();

    let [profile] = await sql`
      SELECT restriction_status FROM profiles WHERE id = ${user.id}
    `;
    if (!profile) {
      const rawName = user.name || user.email?.split("@")[0] || "farmer";
      const cleanUser = rawName.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 15);
      const username = `mqulima_${cleanUser}`;
      try {
        await sql`
          INSERT INTO profiles (id, username, full_name, email, county_region, restriction_status, reputation_score, followers_count)
          VALUES (
            ${user.id},
            ${username},
            ${user.name || "Mqulima Farmer"},
            ${user.email || null},
            ${user.county || "Kenya"},
            'active',
            0,
            0
          )
          ON CONFLICT (id) DO NOTHING
        `;
      } catch (e) {
        console.error("Auto profile creation notice:", e);
      }
    } else if (profile.restriction_status && profile.restriction_status !== 'active') {
      throw new Error(`Action blocked. Your account status is: ${profile.restriction_status.toUpperCase()}. Reason: violation of community guidelines.`);
    }

    const categoryMap: Record<string, string> = {
      "Harvest Update": "harvest",
      "Success Story": "story",
      "Farming Tips": "tips",
      "Question": "question",
      "Farm Progress": "update",
    };
    const type = categoryMap[data.category] || "update";

    const textToCheck = `${data.title} ${data.body} ${data.tags.join(" ")}`;
    const modResult = await autoModeratePostOrComment(sql, user.id, "post", textToCheck);
    const postStatus = modResult.status === "flagged" ? "flagged" : "published";

    const [post] = await sql`
      INSERT INTO show_posts (user_id, type, title, caption, media_urls, tags, status)
      VALUES (
        ${user.id},
        ${type},
        ${data.title},
        ${data.body},
        ${data.images},
        ${data.tags},
        ${postStatus}
      )
      RETURNING id
    `;

    if (modResult.status === 'flagged') {
      await sql`
        INSERT INTO forum_reports (reporter_id, content_type, content_id, reason, details, status)
        VALUES (NULL, 'post', ${post.id}, 'spam', ${`[Auto-Moderation] ${modResult.flaggedReason}`}, 'pending')
      `;
      await sql`
        UPDATE show_posts SET reports_count = reports_count + 1 WHERE id = ${post.id}
      `;
    }

    return { success: true, postId: post.id };
  });

export const createComment = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    postId: z.string().uuid(),
    parentId: z.string().uuid().optional(),
    body: z.string().min(1),
    csrfToken: z.string(),
  }))
  .handler(async ({ data }) => {
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(data.csrfToken);

    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const { getDb } = await import("../db.server");
    const sql = getDb();

    const [profile] = await sql`
      SELECT restriction_status FROM profiles WHERE id = ${user.id}
    `;
    if (!profile) {
      const username = `@mqulima_${(user.name || "farmer").toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      try {
        await sql`
          INSERT INTO profiles (id, username, full_name, email, county_region, restriction_status, reputation_score, followers_count)
          VALUES (${user.id}, ${username}, ${user.name || "Mqulima Farmer"}, ${user.email || null}, ${user.county || "Kenya"}, 'active', 0, 0)
          ON CONFLICT (id) DO NOTHING
        `;
      } catch (e) {
        console.error("Auto profile creation notice:", e);
      }
    } else if (profile.restriction_status && profile.restriction_status !== 'active') {
      throw new Error(`Action blocked. Your account status is: ${profile.restriction_status.toUpperCase()}. Reason: violation of community guidelines.`);
    }

    const modResult = await autoModeratePostOrComment(sql, user.id, "comment", data.body);

    let commentId: string | null = null;
    await sql.begin(async (tx: any) => {
      const [comment] = await tx`
        INSERT INTO show_comments (post_id, parent_id, user_id, body, status)
        VALUES (${data.postId}, ${data.parentId || null}, ${user.id}, ${data.body}, ${modResult.status})
        RETURNING id
      `;
      commentId = comment.id;

      await tx`
        UPDATE show_posts SET comment_count = comment_count + 1 WHERE id = ${data.postId}
      `;

      // Create notification for post author
      const [postInfo] = await tx`
        SELECT user_id, title, caption FROM show_posts WHERE id = ${data.postId}
      `;
      if (postInfo && postInfo.user_id !== user.id) {
        const postLabel = postInfo.title || (postInfo.caption ? postInfo.caption.slice(0, 30) : "your post");
        await tx`
          INSERT INTO notifications (user_id, type, payload)
          VALUES (
            ${postInfo.user_id},
            'comment',
            ${JSON.stringify({
              title: "New Comment",
              sub: `💬 ${user.name || user.email} commented on "${postLabel}": "${data.body.slice(0, 45)}"`,
              postId: data.postId,
              actorName: user.name || user.email
            })}::jsonb
          )
        `;
      }

      if (modResult.status === 'flagged') {
        await tx`
          INSERT INTO forum_reports (reporter_id, content_type, content_id, reason, details, status)
          VALUES (NULL, 'comment', ${comment.id}, 'spam', ${`[Auto-Moderation] ${modResult.flaggedReason}`}, 'pending')
        `;
        await tx`
          UPDATE show_comments SET reports_count = reports_count + 1 WHERE id = ${comment.id}
        `;
      }
    });

    return { success: true, commentId };
  });


export const toggleLikePost = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    postId: z.string().uuid(),
    csrfToken: z.string(),
  }))
  .handler(async ({ data }) => {
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(data.csrfToken);

    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const { getDb } = await import("../db.server");
    const sql = getDb();

    const [existing] = await sql`
      SELECT id FROM show_likes WHERE post_id = ${data.postId} AND user_id = ${user.id}
    `;

    if (existing) {
      await sql`
        DELETE FROM show_likes WHERE id = ${existing.id}
      `;
      await sql`
        UPDATE show_posts SET like_count = GREATEST(0, like_count - 1) WHERE id = ${data.postId}
      `;
      return { success: true, liked: false };
    } else {
      await sql`
        INSERT INTO show_likes (post_id, user_id) VALUES (${data.postId}, ${user.id})
      `;
      await sql`
        UPDATE show_posts SET like_count = like_count + 1 WHERE id = ${data.postId}
      `;

      // Create notification for post author
      const [postInfo] = await sql`
        SELECT user_id, title, caption FROM show_posts WHERE id = ${data.postId}
      `;
      if (postInfo && postInfo.user_id !== user.id) {
        const postLabel = postInfo.title || (postInfo.caption ? postInfo.caption.slice(0, 30) : "your post");
        await sql`
          INSERT INTO notifications (user_id, type, payload)
          VALUES (
            ${postInfo.user_id},
            'like',
            ${JSON.stringify({
              title: "Post Liked",
              sub: `❤️ ${user.name || user.email} liked your post "${postLabel}"`,
              postId: data.postId,
              actorName: user.name || user.email
            })}::jsonb
          )
        `;
      }

      return { success: true, liked: true };
    }
  });

export const createSokoListing = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    commodityName: z.string().min(1),
    type: z.enum(["crop", "livestock", "fruit"]),
    price: z.number().gt(0, "Asking price must be greater than KES 0"),
    quantity: z.string().min(1),
    location: z.string().min(1),
    description: z.string(),
    images: z.array(z.string()),
    phone: z.string().optional(),
    csrfToken: z.string(),
  }))

  .handler(async ({ data }) => {
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(data.csrfToken);

    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const { getDb } = await import("../db.server");
    const sql = getDb();

    let [commodity] = await sql`
      SELECT id FROM commodities WHERE LOWER(name) = ${data.commodityName.toLowerCase()}
    `;
    if (!commodity) {
      let catId: string | null = null;
      try {
        const searchPattern = data.type === "crop" ? "%crop%" : data.type === "fruit" ? "%fruit%" : "%livestock%";
        const [category] = await sql`
          SELECT id FROM product_categories WHERE name ILIKE ${searchPattern} LIMIT 1
        `;
        catId = category?.id || null;
      } catch {
        catId = null;
      }

      [commodity] = await sql`
        INSERT INTO commodities (name, unit, category_id)
        VALUES (${data.commodityName}, 'Bags', ${catId})
        RETURNING id
      `;
    }

    const qtyParts = data.quantity.split(" ");
    const qtyVal = parseFloat(qtyParts[0]) || 1;
    const unitVal = qtyParts.slice(1).join(" ") || "Bags";

    await sql`
      INSERT INTO commodity_listings (user_id, commodity_id, quantity, asking_price, location, description, image_urls, contact_phone, status)
      VALUES (
        ${user.id},
        ${commodity.id},
        ${qtyVal},
        ${data.price},
        ${data.location},
        ${data.description},
        ${data.images},
        ${data.phone || null},
        'active'
      )
    `;

    return { success: true };
  });

export const toggleBookmarkPost = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    postId: z.string().uuid(),
    csrfToken: z.string(),
  }))
  .handler(async ({ data }) => {
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(data.csrfToken);

    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const { getDb } = await import("../db.server");
    const sql = getDb();

    const [existing] = await sql`
      SELECT id FROM show_bookmarks WHERE post_id = ${data.postId} AND user_id = ${user.id}
    `;

    if (existing) {
      await sql`
        DELETE FROM show_bookmarks WHERE id = ${existing.id}
      `;
      return { success: true, saved: false };
    } else {
      await sql`
        INSERT INTO show_bookmarks (post_id, user_id) VALUES (${data.postId}, ${user.id})
      `;
      return { success: true, saved: true };
    }
  });

export const deleteCommunityPost = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    postId: z.string().uuid(),
    csrfToken: z.string(),
  }))
  .handler(async ({ data }) => {
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(data.csrfToken);

    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const { getDb } = await import("../db.server");
    const sql = getDb();

    const [post] = await sql`
      SELECT user_id FROM show_posts WHERE id = ${data.postId}
    `;
    if (!post) throw new Error("Post not found");

    if (post.user_id !== user.id && user.role !== "admin" && user.role !== "super_admin") {
      throw new Error("You are not authorized to delete this post");
    }

    await sql`
      UPDATE show_posts SET status = 'deleted' WHERE id = ${data.postId}
    `;
    return { success: true };
  });

export const deleteComment = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    commentId: z.string().uuid(),
    csrfToken: z.string(),
  }))
  .handler(async ({ data }) => {
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(data.csrfToken);

    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const { getDb } = await import("../db.server");
    const sql = getDb();

    const [comment] = await sql`
      SELECT user_id FROM show_comments WHERE id = ${data.commentId}
    `;
    if (!comment) throw new Error("Comment not found");

    if (comment.user_id !== user.id && user.role !== "admin" && user.role !== "super_admin") {
      throw new Error("You are not authorized to delete this comment");
    }

    await sql`
      UPDATE show_comments SET status = 'deleted' WHERE id = ${data.commentId}
    `;
    return { success: true };
  });

export const reportCommunityContent = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    contentType: z.enum(["post", "comment", "profile"]),
    contentId: z.string().uuid(),
    reason: z.enum(["spam", "harassment", "false_information", "scam", "inappropriate_content", "violence", "copyright", "other"]),
    details: z.string().optional(),
    csrfToken: z.string(),
  }))
  .handler(async ({ data }) => {
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(data.csrfToken);

    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();

    const { getDb } = await import("../db.server");
    const sql = getDb();

    await sql`
      INSERT INTO forum_reports (reporter_id, content_type, content_id, reason, details, status)
      VALUES (
        ${user ? user.id : null},
        ${data.contentType},
        ${data.contentId},
        ${data.reason},
        ${data.details || null},
        'pending'
      )
    `;

    const [modSettings] = await sql`SELECT auto_flag_report_threshold FROM moderation_settings LIMIT 1`.catch(() => []);
    const threshold = modSettings?.auto_flag_report_threshold ?? 3;

    if (data.contentType === "post") {
      await sql`
        UPDATE show_posts 
        SET reports_count = reports_count + 1,
            status = CASE WHEN (reports_count + 1) >= ${threshold} THEN 'hidden' ELSE status END
        WHERE id = ${data.contentId}
      `;
    } else if (data.contentType === "comment") {
      await sql`
        UPDATE show_comments 
        SET reports_count = reports_count + 1,
            status = CASE WHEN (reports_count + 1) >= ${threshold} THEN 'hidden' ELSE status END
        WHERE id = ${data.contentId}
      `;
    }

    return { success: true };
  });

export const sendDirectMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    recipientUsername: z.string().min(1),
    body: z.string().min(1),
    imageUrl: z.string().optional(),
    csrfToken: z.string(),
  }))
  .handler(async ({ data }) => {
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(data.csrfToken);

    const { getCurrentUser } = await import("../auth-server");
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized: Please sign in to send messages.");

    const { getDb } = await import("../db.server");
    const sql = getDb();

    const cleanUsername = data.recipientUsername.replace(/^@/, "").trim().toLowerCase();

    const [recipient] = await sql`
      SELECT id, username, full_name FROM profiles
      WHERE LOWER(username) = ${cleanUsername} AND deleted_at IS NULL
    `;

    if (!recipient) {
      throw new Error(`User @${cleanUsername} was not found.`);
    }

    if (recipient.id === currentUser.id) {
      throw new Error("You cannot send a message to yourself.");
    }

    const [msg] = await sql`
      INSERT INTO direct_messages (sender_id, recipient_id, body, image_url)
      VALUES (${currentUser.id}, ${recipient.id}, ${data.body.trim()}, ${data.imageUrl || null})
      RETURNING id, sender_id, recipient_id, body, image_url, is_read, created_at
    `;

    await sql`
      INSERT INTO notifications (user_id, type, payload)
      VALUES (
        ${recipient.id},
        'message',
        ${JSON.stringify({
          title: "New Message",
          sub: `💬 Direct message from ${currentUser.name || currentUser.email}: "${data.body.trim().slice(0, 45)}"`,
          senderUsername: currentUser.email,
          actorName: currentUser.name || currentUser.email
        })}::jsonb
      )
    `;

    const [senderProfile] = await sql`
      SELECT username FROM profiles WHERE id = ${currentUser.id}
    `;
    const senderUsername = senderProfile?.username
      ? (senderProfile.username.startsWith("@") ? senderProfile.username : `@${senderProfile.username}`)
      : currentUser.email || "@mqulima_farmer";

    return {
      success: true,
      message: {
        id: msg.id,
        sender: senderUsername,
        text: msg.body,
        image: msg.image_url,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        read: msg.is_read
      }
    };
  });

export const getDirectMessages = createServerFn({ method: "GET" })
  .inputValidator(z.object({
    otherUsername: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { getCurrentUser } = await import("../auth-server");
    const currentUser = await getCurrentUser();
    if (!currentUser) return { conversations: [], messages: [] };

    const { getDb } = await import("../db.server");
    const sql = getDb();

    let messages: any[] = [];
    if (data.otherUsername) {
      const cleanUsername = data.otherUsername.replace(/^@/, "").trim().toLowerCase();
      const [otherUser] = await sql`
        SELECT id FROM profiles WHERE LOWER(username) = ${cleanUsername} AND deleted_at IS NULL
      `;

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
          JOIN profiles sp ON sp.id = m.sender_id
          WHERE (m.sender_id = ${currentUser.id} AND m.recipient_id = ${otherUser.id})
             OR (m.sender_id = ${otherUser.id} AND m.recipient_id = ${currentUser.id})
          ORDER BY m.created_at ASC
        `;

        messages = rawMsgs.map((m: any) => ({
          id: m.id,
          sender: m.sender_username?.startsWith("@") ? m.sender_username : `@${m.sender_username || "farmer"}`,
          text: m.body,
          image: m.image_url,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          read: m.is_read
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
        p.reputation_score,
        p.years_farming,
        p.crops,
        p.livestock,
        p.bio,
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
      isGroup: false,
      unreadCount: p.unread_count || 0,
      lastMessage: p.last_message || "",
      lastMessageTime: p.last_message_at ? new Date(p.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
      farmer: {
        username: p.username?.startsWith("@") ? p.username : `@${p.username || "farmer"}`,
        name: p.full_name || "Mqulima Farmer",
        country: "Kenya",
        county: p.county_region || "Kenya",
        interests: [],
        crops: p.crops || [],
        livestock: p.livestock || [],
        yearsFarming: p.years_farming || 0,
        certifications: [],
        reputationScore: p.reputation_score || 0,
        followersCount: 0,
        followers: [],
        avatarUrl: p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.full_name || "Farmer")}&backgroundColor=1a5438&textColor=ffffff`,
        coverImage: "",
        bio: p.bio || "",
        website: "",
        joinedDate: "2024"
      }
    }));

    return {
      conversations,
      messages
    };
  });

export const getCommunityNotifications = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser().catch(() => null);
    if (!user) {
      return [
        {
          id: "sys_welcome",
          type: "system",
          text: "🌱 Welcome to Mqulima Community! Connect with verified farmers across Kenya.",
          time: "Just now",
          read: false,
          linkType: "general"
        }
      ];
    }

    const { getDb } = await import("../db.server");
    const sql = getDb();

    // 1. Fetch DB notifications
    const dbNotifs = await sql`
      SELECT id, type, payload, read_at, created_at
      FROM notifications
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 20
    `;

    // 2. Fetch unread direct messages
    const unreadMsgs = await sql`
      SELECT dm.id, dm.body, dm.created_at, p.full_name, p.username
      FROM direct_messages dm
      JOIN profiles p ON p.id = dm.sender_id
      WHERE dm.recipient_id = ${user.id} AND dm.is_read = false
      ORDER BY dm.created_at DESC
      LIMIT 10
    `;

    const result: any[] = [];

    // Map unread direct messages first
    for (const msg of unreadMsgs) {
      const senderName = msg.full_name || msg.username || "Farmer";
      result.push({
        id: `msg_${msg.id}`,
        type: "message",
        text: `💬 Pending Message from ${senderName}: "${msg.body.slice(0, 45)}"`,
        time: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        read: false,
        linkType: "chat",
        senderUsername: msg.username
      });
    }

    // Map DB notifications
    for (const n of dbNotifs) {
      const payload = n.payload || {};
      result.push({
        id: n.id,
        type: n.type,
        text: payload.sub || payload.title || "New notification",
        time: new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        read: !!n.read_at,
        linkType: n.type === 'like' || n.type === 'comment' ? 'post' : (n.type === 'message' ? 'chat' : 'general'),
        postId: payload.postId,
        senderUsername: payload.senderUsername
      });
    }

    if (result.length === 0) {
      result.push({
        id: "sys_default",
        type: "system",
        text: "🌾 Welcome to Mqulima! Your post likes, comments, and messages will appear here.",
        time: "Today",
        read: true,
        linkType: "general"
      });
    }

    return result;
  });

export const markCommunityNotificationRead = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    notificationId: z.string(),
    csrfToken: z.string()
  }))
  .handler(async ({ data }) => {
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(data.csrfToken);

    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const { getDb } = await import("../db.server");
    const sql = getDb();

    if (data.notificationId.startsWith("msg_")) {
      const realMsgId = data.notificationId.replace(/^msg_/, "");
      await sql`
        UPDATE direct_messages
        SET is_read = true
        WHERE id = ${realMsgId} AND recipient_id = ${user.id}
      `;
    } else if (!data.notificationId.startsWith("sys_")) {
      await sql`
        UPDATE notifications
        SET read_at = NOW()
        WHERE id = ${data.notificationId} AND user_id = ${user.id}
      `;
    }

    return { success: true };
  });

export const markAllCommunityNotificationsRead = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    csrfToken: z.string()
  }))
  .handler(async ({ data }) => {
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(data.csrfToken);

    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const { getDb } = await import("../db.server");
    const sql = getDb();

    await sql`
      UPDATE notifications
      SET read_at = NOW()
      WHERE user_id = ${user.id} AND read_at IS NULL
    `;

    await sql`
      UPDATE direct_messages
      SET is_read = true
      WHERE recipient_id = ${user.id} AND is_read = false
    `;

    return { success: true };
  });

export const submitForumConsultation = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone number is required"),
    email: z.string().optional(),
    county: z.string().min(1),
    specialty: z.string().min(1),
    channel: z.enum(["call", "whatsapp", "visit"]),
    urgency: z.enum(["normal", "urgent", "emergency"]),
    message: z.string().min(5, "Inquiry details are required"),
    csrfToken: z.string()
  }))
  .handler(async ({ data }) => {
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(data.csrfToken);

    const { getDb } = await import("../db.server");
    const sql = getDb();

    const formattedSubject = `[Consultation - ${data.urgency.toUpperCase()}] ${data.specialty} (${data.county})`;
    const formattedUserType = `Farmer Client (${data.channel.toUpperCase()} Desk)`;
    const formattedPhone = data.phone;
    const formattedEmail = data.email && data.email.trim() ? data.email.trim() : "farmer@mqulima.co.ke";

    const formattedMessage = `Subject: ${formattedSubject}\nUser Type: ${formattedUserType}\nPhone: ${formattedPhone}\n\nMessage:\nSpecialty: ${data.specialty}\nCounty: ${data.county}\nUrgency: ${data.urgency.toUpperCase()}\nPreferred Contact Method: ${data.channel}\n\nFarmer Inquiry Details:\n${data.message}`;

    const [submission] = await sql`
      INSERT INTO contact_submissions (name, email, message)
      VALUES (${data.name}, ${formattedEmail}, ${formattedMessage})
      RETURNING id, created_at
    `;

    return {
      success: true,
      ticketId: `MQ-CONSULT-${String(submission?.id || Math.floor(100000 + Math.random() * 900000)).substring(0, 8).toUpperCase()}`
    };
  });

export const toggleFollowFarmer = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    targetUsername: z.string().min(1),
    csrfToken: z.string(),
  }))
  .handler(async ({ data }) => {
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(data.csrfToken);

    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized: Please sign in to follow farmers.");

    const { getDb } = await import("../db.server");
    const sql = getDb();

    const cleanUsername = data.targetUsername.replace(/^@/, "").trim().toLowerCase();
    const [targetProfile] = await sql`
      SELECT id, username, full_name, followers_count FROM profiles WHERE LOWER(username) = ${cleanUsername} AND deleted_at IS NULL
    `;
    if (!targetProfile) throw new Error("Farmer profile not found");

    if (targetProfile.id === user.id) {
      throw new Error("You cannot follow yourself.");
    }

    const [existing] = await sql`
      SELECT id FROM farmer_followers WHERE farmer_id = ${targetProfile.id} AND follower_id = ${user.id}
    `;

    if (existing) {
      await sql`DELETE FROM farmer_followers WHERE id = ${existing.id}`;
      await sql`UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = ${targetProfile.id}`;
      return { success: true, following: false, targetUsername: cleanUsername };
    } else {
      await sql`
        INSERT INTO farmer_followers (farmer_id, follower_id)
        VALUES (${targetProfile.id}, ${user.id})
      `;
      await sql`
        UPDATE profiles SET followers_count = followers_count + 1 WHERE id = ${targetProfile.id}
      `;

      await sql`
        INSERT INTO notifications (user_id, type, payload)
        VALUES (
          ${targetProfile.id},
          'follow',
          ${JSON.stringify({
            title: "New Follower",
            sub: `👤 ${user.name || user.email} started following your farm profile!`,
            actorName: user.name || user.email
          })}::jsonb
        )
      `;

      return { success: true, following: true, targetUsername: cleanUsername };
    }
  });

