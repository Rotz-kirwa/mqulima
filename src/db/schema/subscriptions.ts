import { pgTable, uuid, text, varchar, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  fullName: text("full_name"),
  phone: text("phone"),
  category: varchar("category", { length: 50 }).notNull(),
  serviceName: varchar("service_name", { length: 255 }).notNull(),
  planCode: varchar("plan_code", { length: 100 }).default("standard"),
  subscriptionType: varchar("subscription_type", { length: 50 }).notNull().default("free"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  billingCycle: varchar("billing_cycle", { length: 50 }).default("none"),
  priceKes: numeric("price_kes", { precision: 10, scale: 2 }).notNull().default("0.00"),
  currency: varchar("currency", { length: 10 }).notNull().default("KES"),
  paymentMethod: varchar("payment_method", { length: 50 }).default("none"),
  paymentReference: varchar("payment_reference", { length: 255 }),
  paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("unpaid"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  nextBillingAt: timestamp("next_billing_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptionEvents = pgTable("subscription_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  actorType: varchar("actor_type", { length: 50 }).notNull().default("system"),
  actorEmail: varchar("actor_email", { length: 255 }),
  previousStatus: varchar("previous_status", { length: 50 }),
  newStatus: varchar("new_status", { length: 50 }),
  notes: text("notes"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type SubscriptionEvent = typeof subscriptionEvents.$inferSelect;
export type NewSubscriptionEvent = typeof subscriptionEvents.$inferInsert;
