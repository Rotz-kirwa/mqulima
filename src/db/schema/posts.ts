import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { profiles } from "./profiles";
import { showPostTypeEnum } from "./enums";

export const showPosts = pgTable("show_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => profiles.id, { onDelete: "cascade" }),
  type: showPostTypeEnum("type").notNull().default("moment"),
  category: text("category"),
  title: text("title"),
  caption: text("caption"),
  mediaUrls: text("media_urls").array().default([]),
  likeCount: integer("like_count").default(0),
  relateCount: integer("relate_count").default(0),
  commentCount: integer("comment_count").default(0),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const showComments = pgTable("show_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => showPosts.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const showLikes = pgTable("show_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => showPosts.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
});

export const pulsePosts = pgTable("pulse_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: text("category"),
  sourceUrl: text("source_url").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const showPostsRelations = relations(showPosts, ({ one, many }) => ({
  user: one(profiles, {
    fields: [showPosts.userId],
    references: [profiles.id],
  }),
  comments: many(showComments),
  likes: many(showLikes),
}));

export const showCommentsRelations = relations(showComments, ({ one }) => ({
  post: one(showPosts, {
    fields: [showComments.postId],
    references: [showPosts.id],
  }),
  user: one(profiles, {
    fields: [showComments.userId],
    references: [profiles.id],
  }),
}));

export type ShowPost = typeof showPosts.$inferSelect;
export type NewShowPost = typeof showPosts.$inferInsert;
export type ShowComment = typeof showComments.$inferSelect;
export type NewShowComment = typeof showComments.$inferInsert;
