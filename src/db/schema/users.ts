import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { farmingTypeEnum } from "./enums";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  email: text("email").notNull().unique(),
  nationalId: text("national_id").notNull().unique(),
  county: text("county").notNull(),
  deliveryLocation: text("delivery_location").notNull(),
  farmingType: farmingTypeEnum("farming_type").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
