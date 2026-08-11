import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/lib/db.server";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";

export const Route = createFileRoute("/api/admin/forum-moderation")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          const sql = getDb();

          // 1. Fetch Flagged Reports from Database
          let reports = await sql`
            SELECT
              fr.id,
              fr.content_type AS "contentType",
              fr.content_id AS "contentId",
              fr.reason,
              fr.details,
              fr.status,
              fr.created_at AS "createdAt",
              p_rep.full_name AS "reporterName",
              p_rep.username AS "reporterUsername"
            FROM forum_reports fr
            LEFT JOIN profiles p_rep ON p_rep.id = fr.reporter_id
            ORDER BY fr.created_at DESC
            LIMIT 50
          `.catch(() => []);

          // Enrich reports with target content details
          const enrichedReports = await Promise.all(
            reports.map(async (rep: any) => {
              let title = "Flagged Content";
              let snippet = rep.details || "No additional details provided.";
              let authorName = "Community User";
              let authorUsername = "@user";
              let authorId = null;

              if (rep.contentType === "post") {
                const [post] = await sql`
                  SELECT sp.id, sp.title, sp.caption, sp.status, p.id AS author_id, p.full_name, p.username
                  FROM show_posts sp
                  LEFT JOIN profiles p ON p.id = sp.user_id
                  WHERE sp.id = ${rep.contentId}
                `.catch(() => []);

                if (post) {
                  title = post.title || "Community Forum Post";
                  snippet = post.caption || snippet;
                  authorName = post.full_name || post.username || "Farmer Author";
                  authorUsername = post.username ? `@${post.username.replace(/^@/, "")}` : "@farmer";
                  authorId = post.author_id;
                }
              } else if (rep.contentType === "comment") {
                const [comment] = await sql`
                  SELECT sc.id, sc.body, sc.status, p.id AS author_id, p.full_name, p.username
                  FROM show_comments sc
                  LEFT JOIN profiles p ON p.id = sc.user_id
                  WHERE sc.id = ${rep.contentId}
                `.catch(() => []);

                if (comment) {
                  title = "Community Comment";
                  snippet = comment.body || snippet;
                  authorName = comment.full_name || comment.username || "Farmer Commenter";
                  authorUsername = comment.username ? `@${comment.username.replace(/^@/, "")}` : "@commenter";
                  authorId = comment.author_id;
                }
              } else if (rep.contentType === "profile") {
                const [profile] = await sql`
                  SELECT id, full_name, username, bio FROM profiles WHERE id = ${rep.contentId}
                `.catch(() => []);

                if (profile) {
                  title = `Farmer Profile: ${profile.full_name || profile.username}`;
                  snippet = profile.bio || "Reported user account profile.";
                  authorName = profile.full_name || profile.username || "User";
                  authorUsername = profile.username ? `@${profile.username.replace(/^@/, "")}` : "@user";
                  authorId = profile.id;
                }
              }

              return {
                id: rep.id,
                contentType: rep.contentType,
                contentId: rep.contentId,
                title,
                snippet,
                reason: rep.reason,
                details: rep.details,
                status: rep.status,
                createdAt: rep.createdAt,
                reporterName: rep.reporterName || "Community Member",
                reporterUsername: rep.reporterUsername ? `@${rep.reporterUsername.replace(/^@/, "")}` : "@moderator",
                authorName,
                authorUsername,
                authorId,
              };
            })
          );

          // 2. Fetch All Community Posts Enriched with Media & Comments
          const postsRaw = await sql`
            SELECT
              sp.id,
              sp.title,
              sp.caption,
              sp.type,
              sp.media_urls AS "mediaUrls",
              sp.tags,
              sp.status,
              sp.like_count AS "likeCount",
              sp.comment_count AS "commentCount",
              sp.reports_count AS "reportsCount",
              sp.created_at AS "createdAt",
              p.id AS "authorId",
              p.full_name AS "authorName",
              p.username AS "authorUsername",
              p.avatar_url AS "authorAvatar"
            FROM show_posts sp
            LEFT JOIN profiles p ON p.id = sp.user_id
            ORDER BY sp.created_at DESC
            LIMIT 100
          `.catch(() => []);

          const allPosts = await Promise.all(
            postsRaw.map(async (post: any) => {
              const comments = await sql`
                SELECT
                  sc.id,
                  sc.body,
                  sc.status,
                  sc.created_at AS "createdAt",
                  p.id AS "authorId",
                  p.full_name AS "authorName",
                  p.username AS "authorUsername",
                  p.avatar_url AS "authorAvatar"
                FROM show_comments sc
                LEFT JOIN profiles p ON p.id = sc.user_id
                WHERE sc.post_id = ${post.id}
                ORDER BY sc.created_at ASC
                LIMIT 50
              `.catch(() => []);

              return {
                ...post,
                comments,
              };
            })
          );

          // 3. Fetch Restricted / Muted Users
          const restrictedProfiles = await sql`
            SELECT
              p.id,
              p.full_name AS "fullName",
              p.username,
              p.email,
              p.restriction_status AS "restrictionStatus",
              p.avatar_url AS "avatarUrl",
              p.created_at AS "createdAt"
            FROM profiles p
            WHERE p.restriction_status IS NOT NULL AND p.restriction_status != 'active'
            ORDER BY p.created_at DESC
            LIMIT 50
          `.catch(() => []);

          // 4. Fetch Moderation Settings
          const [settings] = await sql`
            SELECT
              id,
              spam_detection_enabled AS "spamDetectionEnabled",
              repeated_posts_window_mins AS "repeatedPostsWindowMins",
              block_external_links AS "blockExternalLinks",
              offensive_words_list AS "offensiveWordsList",
              auto_flag_report_threshold AS "autoFlagReportThreshold"
            FROM moderation_settings
            LIMIT 1
          `.catch(() => []);

          const defaultSettings = settings || {
            spamDetectionEnabled: true,
            repeatedPostsWindowMins: 5,
            blockExternalLinks: false,
            offensiveWordsList: ["scam", "fake", "hacked", "casino", "betting"],
            autoFlagReportThreshold: 3,
          };

          // 5. Aggregate Summary Metrics
          const pendingCount = enrichedReports.filter((r) => r.status === "pending").length;
          const totalPostsCount = allPosts.length;
          const restrictedCount = restrictedProfiles.length;
          const hiddenCount = allPosts.filter((p: any) => p.status === "hidden" || p.status === "flagged" || p.status === "deleted").length;

          return new Response(
            JSON.stringify({
              success: true,
              reports: enrichedReports,
              posts: allPosts,
              restrictedUsers: restrictedProfiles,
              settings: defaultSettings,
              stats: {
                totalPosts: totalPostsCount,
                pendingReports: pendingCount,
                restrictedUsers: restrictedCount,
                hiddenPosts: hiddenCount,
              },
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (error: any) {
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
          const { action, id, settings } = body;
          const sql = getDb();

          // Action 1: Update Post Status (hide / publish / delete)
          if (action === "update_post_status") {
            const { postId, newStatus } = body;
            await sql`
              UPDATE show_posts SET status = ${newStatus} WHERE id = ${postId}
            `;
            await logAdminAction({
              actorId: "admin-desk",
              action: `FORUM_POST_${newStatus.toUpperCase()}`,
              entity: "show_posts",
              entityId: postId,
            });
            return new Response(JSON.stringify({ success: true, message: `Post status updated to ${newStatus}` }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          // Action 1b: Update Comment Status
          if (action === "update_comment_status") {
            const { commentId, newStatus } = body;
            await sql`
              UPDATE show_comments SET status = ${newStatus} WHERE id = ${commentId}
            `;
            await logAdminAction({
              actorId: "admin-desk",
              action: `FORUM_COMMENT_${newStatus.toUpperCase()}`,
              entity: "show_comments",
              entityId: commentId,
            });
            return new Response(JSON.stringify({ success: true, message: `Comment status updated to ${newStatus}` }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          // Action 2: Dismiss or Resolve Report
          if (action === "dismiss_report" || action === "resolve_report") {
            const reportId = id;
            const newReportStatus = action === "dismiss_report" ? "dismissed" : "resolved";

            if (reportId) {
              await sql`
                UPDATE forum_reports SET status = ${newReportStatus} WHERE id = ${reportId}
              `;
            }

            await logAdminAction({
              actorId: "admin-desk",
              action: `REPORT_${newReportStatus.toUpperCase()}`,
              entity: "forum_reports",
              entityId: reportId,
            });

            return new Response(JSON.stringify({ success: true, message: `Report marked as ${newReportStatus}` }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          // Action 3: Take Direct Content Moderation Action (Hide content + Resolve report)
          if (action === "moderate_content") {
            const { reportId, targetContentType, targetContentId, mode } = body;

            if (targetContentType === "post") {
              const postStatus = mode === "hide" ? "hidden" : mode === "delete" ? "deleted" : "published";
              await sql`
                UPDATE show_posts SET status = ${postStatus} WHERE id = ${targetContentId}
              `;
            } else if (targetContentType === "comment") {
              const commentStatus = mode === "hide" ? "hidden" : mode === "delete" ? "deleted" : "published";
              await sql`
                UPDATE show_comments SET status = ${commentStatus} WHERE id = ${targetContentId}
              `;
            }

            if (reportId) {
              await sql`
                UPDATE forum_reports SET status = 'resolved' WHERE id = ${reportId}
              `;
            }

            await logAdminAction({
              actorId: "admin-desk",
              action: `FORUM_CONTENT_${mode.toUpperCase()}`,
              entity: targetContentType === "post" ? "show_posts" : "show_comments",
              entityId: targetContentId,
            });

            return new Response(JSON.stringify({ success: true, message: `Content ${mode}d successfully` }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          // Action 4: Restrict / Mute / Ban User
          if (action === "restrict_user") {
            const { userId, type = "restricted", durationDays = 1, reasonText = "Violating community forum guidelines" } = body;

            if (userId) {
              await sql`
                UPDATE profiles SET restriction_status = ${type} WHERE id = ${userId}
              `;

              await sql`
                INSERT INTO user_restrictions (user_id, restriction_type, expires_at, reason)
                VALUES (
                  ${userId},
                  ${type},
                  NOW() + (${durationDays} || ' days')::INTERVAL,
                  ${reasonText}
                )
              `;
            }

            await logAdminAction({
              actorId: "admin-desk",
              action: `USER_${type.toUpperCase()}`,
              entity: "profiles",
              entityId: userId,
            });

            return new Response(JSON.stringify({ success: true, message: `User restriction applied (${type})` }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          // Action 5: Lift User Restriction (Unban)
          if (action === "unban_user") {
            const { userId } = body;
            if (userId) {
              await sql`
                UPDATE profiles SET restriction_status = 'active' WHERE id = ${userId}
              `;
            }

            await logAdminAction({
              actorId: "admin-desk",
              action: "USER_UNBANNED",
              entity: "profiles",
              entityId: userId,
            });

            return new Response(JSON.stringify({ success: true, message: "User status restored to active" }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          // Action 6: Update Moderation Settings
          if (action === "update_settings") {
            const { spamDetectionEnabled, blockExternalLinks, autoFlagReportThreshold, offensiveWordsList } = settings || {};

            const [existing] = await sql`SELECT id FROM moderation_settings LIMIT 1`;
            if (existing) {
              await sql`
                UPDATE moderation_settings
                SET
                  spam_detection_enabled = ${spamDetectionEnabled ?? true},
                  block_external_links = ${blockExternalLinks ?? false},
                  auto_flag_report_threshold = ${autoFlagReportThreshold ?? 3},
                  offensive_words_list = ${offensiveWordsList || []},
                  updated_at = NOW()
                WHERE id = ${existing.id}
              `;
            } else {
              await sql`
                INSERT INTO moderation_settings (spam_detection_enabled, block_external_links, auto_flag_report_threshold, offensive_words_list)
                VALUES (
                  ${spamDetectionEnabled ?? true},
                  ${blockExternalLinks ?? false},
                  ${autoFlagReportThreshold ?? 3},
                  ${offensiveWordsList || []}
                )
              `;
            }

            return new Response(JSON.stringify({ success: true, message: "Moderation settings updated" }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ success: false, error: "Invalid moderation action" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
