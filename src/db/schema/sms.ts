import { pgTable, uuid, varchar, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const smsLogs = pgTable("sms_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipient: varchar("recipient", { length: 50 }).notNull(),
  message: text("message").notNull(),
  triggerType: varchar("trigger_type", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(), // 'success' | 'failed' | 'mocked'
  responsePayload: jsonb("response_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SmsLog = typeof smsLogs.$inferSelect;
export type NewSmsLog = typeof smsLogs.$inferInsert;
