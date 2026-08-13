import { pgTable, varchar, text, integer, timestamp, jsonb, boolean, real, uuid } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  actorId: varchar("actor_id", { length: 255 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }),
  entityId: varchar("entity_id", { length: 255 }),
  diff: jsonb("diff"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminQuotations = pgTable("quotations", {
  id: varchar("id", { length: 255 }).primaryKey(),
  customerId: varchar("customer_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  itemsJson: jsonb("items_json").notNull(),
  totalAmountKsh: real("total_amount_ksh").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const logisticsRecords = pgTable("logistics_records", {
  id: varchar("id", { length: 255 }).primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  courierName: varchar("courier_name", { length: 255 }).notNull(),
  zone: varchar("zone", { length: 100 }).notNull(),
  dispatchStatus: varchar("dispatch_status", { length: 50 }).default("pending").notNull(),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  proofUrl: text("proof_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const featuredItems = pgTable("featured_items", {
  id: varchar("id", { length: 255 }).primaryKey(),
  entityType: varchar("entity_type", { length: 50 }).notNull().default("image"), // 'image' | 'product' | 'course' | 'post'
  entityId: varchar("entity_id", { length: 255 }).notNull().default("custom"),
  imageUrl: text("image_url"),
  title: varchar("title", { length: 255 }),
  linkUrl: varchar("link_url", { length: 255 }),
  position: integer("position").default(0).notNull(),
  activeFrom: timestamp("active_from"),
  activeTo: timestamp("active_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const marketPriceOverrides = pgTable("market_price_overrides", {
  id: varchar("id", { length: 255 }).primaryKey(),
  commodityName: varchar("commodity_name", { length: 100 }).notNull(),
  officialPriceKsh: real("official_price_ksh").notNull(),
  adminOverridePriceKsh: real("admin_override_price_ksh"),
  unit: varchar("unit", { length: 50 }).default("90kg").notNull(),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiQueryLogs = pgTable("ai_query_logs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  prompt: text("prompt").notNull(),
  confidenceScore: real("confidence_score").default(0.95),
  flaggedForReview: boolean("flagged_for_review").default(false).notNull(),
  tokenCount: integer("token_count").default(0),
  costUsd: real("cost_usd").default(0.0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agritechNews = pgTable("agritech_news", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  summary: text("summary"),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }).default("Agri-News").notNull(),
  sourceAttribution: varchar("source_attribution", { length: 255 }),
  authorId: varchar("author_id", { length: 255 }),
  status: varchar("status", { length: 50 }).default("draft").notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
