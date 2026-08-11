import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { profiles } from "./profiles";

export const directMessages = pgTable("direct_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderId: uuid("sender_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  receiverId: uuid("receiver_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  messageText: text("message_text").notNull(),
  imageUrl: text("image_url"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  sender: one(profiles, {
    fields: [directMessages.senderId],
    references: [profiles.id],
    relationName: "senderMessages",
  }),
  receiver: one(profiles, {
    fields: [directMessages.receiverId],
    references: [profiles.id],
    relationName: "receiverMessages",
  }),
}));

export type DirectMessage = typeof directMessages.$inferSelect;
export type NewDirectMessage = typeof directMessages.$inferInsert;
