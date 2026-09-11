import { pgTable, uuid, text, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { productStatusEnum } from "./enums";

export const productCategories = pgTable("product_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  parentCategoryId: uuid("parent_category_id"),
  posCategoryRef: text("pos_category_ref"),
  icon: text("icon"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  categoryId: uuid("category_id").references(() => productCategories.id, { onDelete: "set null" }),
  description: text("description"),
  basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull().default("0"),
  originalPrice: numeric("original_price", { precision: 12, scale: 2 }),
  imageUrls: text("image_urls").array().default([]),
  stockQty: integer("stock_qty").notNull().default(0),
  isFeatured: boolean("is_featured").default(false),
  avgRating: numeric("avg_rating", { precision: 3, scale: 2 }).default("0"),
  ratingCount: integer("rating_count").default(0),
  status: productStatusEnum("status").notNull().default("draft"),
  brand: text("brand"),
  seller: text("seller"),
  county: text("county"),
  unit: text("unit"),
  badge: text("badge"),
  organic: boolean("organic").default(false),
  verifiedSeller: boolean("verified_seller").default(false),
  sellerScore: integer("seller_score").default(0),
  condition: text("condition"),
  shopType: text("shop_type"),
  field: text("field"),
  subcategory: text("subcategory"),
  externalProductId: text("external_product_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variantLabel: text("variant_label").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  stockQty: integer("stock_qty").notNull().default(0),
  sku: text("sku"),
  externalVariationId: text("external_variation_id"),
  location: text("location"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const posAuthTokens = pgTable("pos_auth_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull().unique(),
  accessToken: text("access_token").notNull(),
  tokenType: text("token_type").default("Bearer"),
  expiresIn: integer("expires_in").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const posSyncLogs = pgTable("pos_sync_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  syncType: text("sync_type").notNull(),
  status: text("status").notNull(),
  productsSynced: integer("products_synced").default(0),
  variationsSynced: integer("variations_synced").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const productCategoriesRelations = relations(productCategories, ({ many, one }) => ({
  parent: one(productCategories, {
    fields: [productCategories.parentCategoryId],
    references: [productCategories.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  variants: many(productVariants),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductCategory = typeof productCategories.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type PosAuthToken = typeof posAuthTokens.$inferSelect;
export type PosSyncLog = typeof posSyncLogs.$inferSelect;

