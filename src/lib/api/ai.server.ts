// ============================================================================
// ai.server.ts — Mqulima AI Backend Service & Server Functions
//
// Manages: Database CRUD for conversation history, system prompt assembly,
// and session authentication checks.
//
// NOTE: Must only contain TanStack Start server functions (createServerFn)
// to ensure the compiler plugin can completely eliminate it on client build.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Helper to load DB dynamically
async function db() {
  const { getDb } = await import("../db.server");
  return getDb();
}

// Helper to load Auth user dynamically
async function getAuthUser() {
  try {
    const { getCurrentUser } = await import("../auth-server");
    return await getCurrentUser();
  } catch (e) {
    return null;
  }
}

// ------------------------------------------------------------------
// 1. Fetch Conversations List
// ------------------------------------------------------------------
export const getConversations = createServerFn({ method: "GET" })
  .handler(async () => {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const sql = await db();
    return await sql`
      SELECT id, title, is_pinned, is_favorite, created_at, updated_at
      FROM ai_conversations
      WHERE user_id = ${user.id}
      ORDER BY is_pinned DESC, updated_at DESC
    `;
  });

// ------------------------------------------------------------------
// 2. Fetch Messages for a Conversation
// ------------------------------------------------------------------
export const getConversationMessages = createServerFn({ method: "POST" })
  .inputValidator(z.object({ conversationId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const sql = await db();

    // Security: Verify ownership
    const [conversation] = await sql`
      SELECT id FROM ai_conversations 
      WHERE id = ${data.conversationId} AND user_id = ${user.id}
    `;
    if (!conversation) throw new Error("Conversation not found");

    return await sql`
      SELECT id, role, content, attachments, created_at
      FROM ai_messages
      WHERE conversation_id = ${data.conversationId}
      ORDER BY created_at ASC
    `;
  });

// ------------------------------------------------------------------
// 3. Create Conversation
// ------------------------------------------------------------------
export const createConversation = createServerFn({ method: "POST" })
  .inputValidator(z.object({ title: z.string().min(1).max(100) }))
  .handler(async ({ data }) => {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const sql = await db();
    const [newConv] = await sql`
      INSERT INTO ai_conversations (user_id, title)
      VALUES (${user.id}, ${data.title})
      RETURNING id, title, is_pinned, is_favorite, created_at, updated_at
    `;
    return newConv;
  });

// ------------------------------------------------------------------
// 4. Rename Conversation
// ------------------------------------------------------------------
export const renameConversation = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    conversationId: z.string().uuid(),
    title: z.string().min(1).max(100)
  }))
  .handler(async ({ data }) => {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const sql = await db();
    const [updated] = await sql`
      UPDATE ai_conversations
      SET title = ${data.title}, updated_at = NOW()
      WHERE id = ${data.conversationId} AND user_id = ${user.id}
      RETURNING id, title, is_pinned, is_favorite, created_at, updated_at
    `;
    if (!updated) throw new Error("Conversation not found");
    return updated;
  });

// ------------------------------------------------------------------
// 5. Delete Conversation
// ------------------------------------------------------------------
export const deleteConversation = createServerFn({ method: "POST" })
  .inputValidator(z.object({ conversationId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const sql = await db();
    const [deleted] = await sql`
      DELETE FROM ai_conversations
      WHERE id = ${data.conversationId} AND user_id = ${user.id}
      RETURNING id
    `;
    if (!deleted) throw new Error("Conversation not found");
    return { success: true };
  });

// ------------------------------------------------------------------
// 6. Toggle Pin status
// ------------------------------------------------------------------
export const togglePinConversation = createServerFn({ method: "POST" })
  .inputValidator(z.object({ conversationId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const sql = await db();
    const [updated] = await sql`
      UPDATE ai_conversations
      SET is_pinned = NOT is_pinned, updated_at = NOW()
      WHERE id = ${data.conversationId} AND user_id = ${user.id}
      RETURNING id, is_pinned, updated_at
    `;
    if (!updated) throw new Error("Conversation not found");
    return updated;
  });

// ------------------------------------------------------------------
// 7. Toggle Favorite status
// ------------------------------------------------------------------
export const toggleFavoriteConversation = createServerFn({ method: "POST" })
  .inputValidator(z.object({ conversationId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const sql = await db();
    const [updated] = await sql`
      UPDATE ai_conversations
      SET is_favorite = NOT is_favorite, updated_at = NOW()
      WHERE id = ${data.conversationId} AND user_id = ${user.id}
      RETURNING id, is_favorite, updated_at
    `;
    if (!updated) throw new Error("Conversation not found");
    return updated;
  });

// ------------------------------------------------------------------
// 8. Delete Message
// ------------------------------------------------------------------
export const deleteMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    messageId: z.string().uuid(),
    conversationId: z.string().uuid()
  }))
  .handler(async ({ data }) => {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const sql = await db();
    
    // Ownership check
    const [conversation] = await sql`
      SELECT id FROM ai_conversations 
      WHERE id = ${data.conversationId} AND user_id = ${user.id}
    `;
    if (!conversation) throw new Error("Conversation not found");

    const [deleted] = await sql`
      DELETE FROM ai_messages
      WHERE id = ${data.messageId} AND conversation_id = ${data.conversationId}
      RETURNING id
    `;
    if (!deleted) throw new Error("Message not found");

    return { success: true };
  });
