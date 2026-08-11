import { eq, isNull, and, desc, asc } from "drizzle-orm";
import { getDb } from "../index";
import {
  aiConversations,
  aiMessages,
  cropDiagnoses,
  type AiConversation,
  type NewAiConversation,
  type AiMessage,
  type NewAiMessage,
  type CropDiagnosis,
  type NewCropDiagnosis,
} from "../schema";

export class AiRepository {
  static async getConversations(userId: string): Promise<AiConversation[]> {
    const db = getDb();
    return db
      .select()
      .from(aiConversations)
      .where(and(eq(aiConversations.userId, userId), isNull(aiConversations.deletedAt)))
      .orderBy(desc(aiConversations.isPinned), desc(aiConversations.updatedAt));
  }

  static async findConversationById(id: string): Promise<AiConversation | undefined> {
    const db = getDb();
    const result = await db
      .select()
      .from(aiConversations)
      .where(and(eq(aiConversations.id, id), isNull(aiConversations.deletedAt)))
      .limit(1);
    return result[0];
  }

  static async createConversation(userId: string, title?: string): Promise<AiConversation> {
    const db = getDb();
    const [created] = await db
      .insert(aiConversations)
      .values({ userId, title: title ?? "New Conversation" })
      .returning();
    return created;
  }

  static async getMessages(conversationId: string): Promise<AiMessage[]> {
    const db = getDb();
    return db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(asc(aiMessages.createdAt));
  }

  static async saveMessage(messageData: NewAiMessage): Promise<AiMessage> {
    const db = getDb();
    return db.transaction(async (tx) => {
      const [saved] = await tx.insert(aiMessages).values(messageData).returning();

      await tx
        .update(aiConversations)
        .set({ updatedAt: new Date() })
        .where(eq(aiConversations.id, messageData.conversationId));

      return saved;
    });
  }

  static async saveDiagnosis(diagnosisData: NewCropDiagnosis): Promise<CropDiagnosis> {
    const db = getDb();
    const [saved] = await db.insert(cropDiagnoses).values(diagnosisData).returning();
    return saved;
  }

  static async getDiagnosesByUserId(userId: string): Promise<CropDiagnosis[]> {
    const db = getDb();
    return db
      .select()
      .from(cropDiagnoses)
      .where(eq(cropDiagnoses.userId, userId))
      .orderBy(desc(cropDiagnoses.createdAt));
  }
}
