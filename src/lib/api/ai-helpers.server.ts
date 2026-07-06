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
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const parts = c.trim().split("=");
      return [parts[0], parts.slice(1).join("=")];
    })
  );
  const token = cookies["mq_session"];
  if (!token) return null;

  try {
    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = (payload.sub || payload.id) as string;

    const { getDb } = await import("../db.server");
    const sql = getDb();
    const [dbUser] = await sql`
      SELECT id, email, full_name, county_region, years_farming, crops, livestock, role
      FROM profiles
      WHERE id = ${userId} AND deleted_at IS NULL
    `;
    if (!dbUser) return null;

    return {
      id: dbUser.id,
      name: dbUser.full_name,
      email: dbUser.email,
      county: dbUser.county_region || "",
      farmSize: `${dbUser.years_farming || 0} years`,
      crops: dbUser.crops ? dbUser.crops.join(", ") : "",
      livestock: dbUser.livestock ? dbUser.livestock.join(", ") : "",
      role: dbUser.role,
    };
  } catch (e) {
    return null;
  }
}
