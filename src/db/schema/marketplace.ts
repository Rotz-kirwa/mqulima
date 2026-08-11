import { pgTable, uuid, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { profiles } from "./profiles";
import { listingStatusEnum } from "./enums";

export const commodities = pgTable("commodities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  unit: text("unit").notNull().default("kg"),
  categoryId: text("category_id"),
});

export const commodityListings = pgTable("commodity_listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  commodityId: uuid("commodity_id").notNull().references(() => commodities.id, { onDelete: "cascade" }),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  askingPrice: numeric("asking_price", { precision: 12, scale: 2 }).notNull(),
  location: text("location"),
  description: text("description"),
  imageUrls: text("image_urls").array().default([]),
  contactPhone: text("contact_phone"),
  status: listingStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const commodityPriceBoard = pgTable("commodity_price_board", {
  id: uuid("id").primaryKey().defaultRandom(),
  commodityId: uuid("commodity_id").notNull().references(() => commodities.id, { onDelete: "cascade" }),
  region: text("region").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  source: text("source"),
});

export const commodityListingsRelations = relations(commodityListings, ({ one }) => ({
  user: one(profiles, {
    fields: [commodityListings.userId],
    references: [profiles.id],
  }),
  commodity: one(commodities, {
    fields: [commodityListings.commodityId],
    references: [commodities.id],
  }),
}));

export type Commodity = typeof commodities.$inferSelect;
export type CommodityListing = typeof commodityListings.$inferSelect;
export type NewCommodityListing = typeof commodityListings.$inferInsert;
