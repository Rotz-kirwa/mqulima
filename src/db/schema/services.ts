import { pgTable, uuid, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { profiles } from "./profiles";
import { serviceRequestStatusEnum, servicePriceTypeEnum } from "./enums";

export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").notNull().references(() => serviceCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  priceType: servicePriceTypeEnum("price_type").notNull().default("quote"),
  basePrice: numeric("base_price", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const serviceRequests = pgTable("service_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  status: serviceRequestStatusEnum("status").notNull().default("requested"),
  assignedExpertId: uuid("assigned_expert_id").references(() => profiles.id, { onDelete: "set null" }),
  notes: text("notes"),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
  location: text("location"),
  reference: text("reference"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  subserviceName: text("subservice_name"),
  farmScale: text("farm_scale"),
  channel: text("channel").default("website"),
  estimatedCost: numeric("estimated_cost", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const serviceRequestsRelations = relations(serviceRequests, ({ one }) => ({
  user: one(profiles, {
    fields: [serviceRequests.userId],
    references: [profiles.id],
  }),
  service: one(services, {
    fields: [serviceRequests.serviceId],
    references: [services.id],
  }),
  assignedExpert: one(profiles, {
    fields: [serviceRequests.assignedExpertId],
    references: [profiles.id],
  }),
}));

export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type NewServiceRequest = typeof serviceRequests.$inferInsert;
