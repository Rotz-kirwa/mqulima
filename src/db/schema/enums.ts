import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin",
  "sales_agent",
  "content_editor",
  "farmer",
  "retailer",
]);

export const productStatusEnum = pgEnum("product_status", [
  "active",
  "draft",
  "archived",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status_enum", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method_enum", [
  "mpesa",
  "airtel_money",
  "bank_transfer",
  "card",
  "gpay",
  "international",
]);

export const checkoutChannelEnum = pgEnum("checkout_channel", [
  "website",
  "whatsapp",
]);

export const quotationStatusEnum = pgEnum("quotation_status", [
  "pending",
  "sent",
  "accepted",
  "expired",
]);

export const serviceRequestStatusEnum = pgEnum("service_request_status", [
  "requested",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
]);

export const servicePriceTypeEnum = pgEnum("service_price_type", [
  "fixed",
  "quote",
  "poa",
]);

export const blogStatusEnum = pgEnum("blog_status", [
  "draft",
  "published",
  "archived",
]);

export const showPostTypeEnum = pgEnum("show_post_type", [
  "harvest",
  "story",
  "tragedy",
  "learning",
  "moment",
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "active",
  "sold",
  "expired",
]);

export const farmingTypeEnum = pgEnum("farming_type", [
  "Crop Farming (Horticulture)",
  "Crop Farming (Cereals & Grains)",
  "Livestock Farming",
  "Dairy Farming",
  "Poultry Farming",
  "Aquaculture",
  "Mixed Farming",
  "Agroforestry",
  "I'm a Buyer/Consumer Only (no farming)",
]);
