// ============================================================================
// ai-helpers.server.ts — Mqulima AI Server Helpers
//
// Separated to prevent client bundlers from scanning server-only methods.
// ============================================================================

// Helper to save message inside the database
export async function assertConversationOwner(conversationId: string, userId: string) {
  const { getDb } = await import("../db.server");
  const sql = getDb();
  const [conversation] = await sql`
    SELECT id
    FROM ai_conversations
    WHERE id = ${conversationId} AND user_id = ${userId}
    LIMIT 1
  `;

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return conversation;
}

export async function saveMessage(conversationId: string, role: "user" | "model", content: string, attachments: any[] = []) {
  const { getDb } = await import("../db.server");
  const sql = getDb();
  const [msg] = await sql`
    INSERT INTO ai_messages (conversation_id, role, content, attachments)
    VALUES (${conversationId}, ${role}, ${content}, ${sql.json(attachments)})
    RETURNING id, role, content, attachments, created_at
  `;
  // Update conversation updated_at
  await sql`
    UPDATE ai_conversations SET updated_at = NOW() WHERE id = ${conversationId}
  `;
  return msg;
}

// Helper to parse JWT user session directly in API routes
export async function getAuthUserFromRequest(request: Request) {
  let token: string | null = null;

  // 1. Check Cookie
  const cookieHeader = request.headers.get("cookie") || "";
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)mq_session=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1].trim());
    }
  }

  // 2. Check Authorization Header
  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) return null;

  try {
    const { jwtVerify } = await import("jose");
    const { getServerConfig } = await import("../config.server");
    const config = getServerConfig();
    const secretKey = config.JWT_SECRET || process.env.JWT_SECRET || "mqulima_jwt_production_secret_key_2026_secure_auth_99";
    const secret = new TextEncoder().encode(secretKey);
    const { payload } = await jwtVerify(token, secret);
    const userId = (payload.sub || payload.id) as string;

    const { getDb } = await import("../db.server");
    const sql = getDb();
    let [dbUser] = await sql`
      SELECT id, email, full_name, county_region, years_farming, crops, livestock, role
      FROM profiles
      WHERE id = ${userId} AND deleted_at IS NULL
    `;

    if (!dbUser) {
      const [rawUser] = await sql`
        SELECT id, email, first_name, last_name, county
        FROM users
        WHERE id = ${userId}
      `;
      if (rawUser) {
        dbUser = {
          id: rawUser.id,
          email: rawUser.email,
          full_name: `${rawUser.first_name || "User"} ${rawUser.last_name || ""}`.trim(),
          county_region: rawUser.county || "",
          years_farming: 0,
          crops: [],
          livestock: [],
          role: "farmer"
        };
      }
    }

    if (!dbUser) return null;

    return {
      id: dbUser.id,
      name: dbUser.full_name,
      email: dbUser.email,
      county: dbUser.county_region || "",
      farmSize: `${dbUser.years_farming || 0} years`,
      crops: dbUser.crops ? dbUser.crops.join(", ") : "",
      livestock: dbUser.livestock ? dbUser.livestock.join(", ") : "",
      role: dbUser.role || "farmer",
    };
  } catch (e) {
    return null;
  }
}
