import { pgTable, uuid, text, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  username: text("username").notNull().unique(),
  country: text("country").notNull().default("Kenya"),
  countyRegion: text("county_region"),
  farmingInterests: text("farming_interests").array().default([]),
  crops: text("crops").array().default([]),
  livestock: text("livestock").array().default([]),
  yearsFarming: integer("years_farming").default(0),
  certifications: text("certifications").array().default([]),
  reputationScore: integer("reputation_score").default(0),
  followersCount: integer("followers_count").default(0),
  role: userRoleEnum("role").notNull().default("farmer"),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  idNumber: text("id_number"),
  deliveryAddress: text("delivery_address"),
  natureOfAgriculture: text("nature_of_agriculture"),
  isRetailer: boolean("is_retailer").default(false),
  retailerDiscountPct: numeric("retailer_discount_pct", { precision: 5, scale: 2 }).default("0"),
  bio: text("bio"),
  website: text("website"),
  coverImage: text("cover_image"),
  farmingActivities: text("farming_activities"),
  farmingPhotos: text("farming_photos").array().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
