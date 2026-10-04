import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const recoveryTokens = pgTable("recovery_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull(),
  tokenHash: text("token_hash").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(5).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type RecoveryToken = typeof recoveryTokens.$inferSelect;
export type NewRecoveryToken = typeof recoveryTokens.$inferInsert;
