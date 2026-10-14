/**
 * Strongly-Typed Google Analytics 4 & Telemetry Event Definitions for Mqulima
 * Standardized on snake_case event names with strict PII prevention.
 */

export interface ConsentPreferences {
  /** Essential session, CSRF, and security cookies (always active) */
  necessary: true;
  /** GA4 visitor trends, engagement, and feature interactions */
  analytics: boolean;
  /** Campaign attribution, referral tracking, and promotion metrics */
  marketing: boolean;
  /** Unix timestamp of last decision */
  updatedAt: number;
  /** Schema version */
  version: number;
}

export type ConsentStatus = "granted" | "denied";

export interface GoogleConsentState {
  analytics_storage: ConsentStatus;
  ad_storage: ConsentStatus;
  ad_user_data: ConsentStatus;
  ad_personalization: ConsentStatus;
  functionality_storage?: ConsentStatus;
  security_storage?: ConsentStatus;
}

export interface PageViewParams {
  page_title?: string;
  page_location?: string;
  page_path?: string;
  page_category?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface SiteSearchParams {
  search_term: string;
  search_type?: "general" | "products" | "commodities" | "services" | "academy" | string;
  results_count?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface NavigationClickedParams {
  link_name: string;
  destination_url?: string;
  menu_location?: "topbar" | "mobile_menu" | "footer" | "hero_action" | "sidebar" | string;
  [key: string]: string | number | boolean | undefined;
}

export interface ContactFormParams {
  form_name?: string;
  user_type?: string;
  subject_category?: string;
  reason?: string;
  error_reason?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface AuthEventParams {
  method?: "password" | "sms_otp" | "email_link" | "google" | "credentials" | "email" | "phone" | string;
  role_selected?: "farmer" | "consumer" | "retailer" | string;
  county?: string;
  farming_type?: string;
  recovery_channel?: "sms" | "email" | string;
  [key: string]: string | number | boolean | undefined;
}

export interface MarketplaceParams {
  product_id?: string;
  product_name?: string;
  product_category?: string;
  category?: string;
  price?: number;
  value?: number;
  currency?: string;
  quantity?: number;
  cart_total?: number;
  items_count?: number;
  order_id?: string;
  transaction_id?: string;
  transaction_value?: number;
  transaction_currency?: string;
  payment_method?: string;
  service_name?: string;
  category_name?: string;
  destination_county?: string;
  county?: string;
  channel?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface AgriFeatureParams {
  county?: string;
  region?: string;
  commodity_name?: string;
  commodity_category?: string;
  market_location?: string;
  service_id?: string;
  service_name?: string;
  service_category?: string;
  course_id?: string;
  course_title?: string;
  course_category?: string;
  post_id?: string;
  post_category?: string;
  community_section?: string;
  has_media?: boolean;
  query_category?: string;
  feature_name?: string;
  prompt_length?: number;
  response_time_ms?: number;
  [key: string]: string | number | boolean | undefined;
}

export type EventParamMap = {
  // General website activity
  page_view: PageViewParams;
  site_search: SiteSearchParams;
  search: SiteSearchParams;
  navigation_clicked: NavigationClickedParams;
  contact_form_started: ContactFormParams | undefined;
  contact_form_submitted: ContactFormParams;
  contact_form_failed: ContactFormParams;
  generate_lead: ContactFormParams | MarketplaceParams;
  share: { method?: string; content_type?: string; item_id?: string; [key: string]: any };

  // Authentication and registration
  sign_up_started: AuthEventParams | undefined;
  sign_up_completed: AuthEventParams;
  sign_up: AuthEventParams;
  login_completed: AuthEventParams;
  login: AuthEventParams;
  logout_completed: Record<string, unknown> | undefined;
  password_reset_requested: AuthEventParams;

  // Marketplace & E-commerce (GA4 recommended e-commerce events)
  marketplace_opened: { referrer_category?: string; [key: string]: any } | undefined;
  product_viewed: MarketplaceParams;
  view_item: MarketplaceParams;
  view_item_list: MarketplaceParams | { item_list_name?: string; [key: string]: any } | undefined;
  product_search_performed: SiteSearchParams;
  product_category_selected: MarketplaceParams;
  quotation_requested: MarketplaceParams;
  quotation_request: MarketplaceParams;
  add_to_cart: MarketplaceParams;
  checkout_started: MarketplaceParams;
  begin_checkout: MarketplaceParams;
  purchase_completed: MarketplaceParams;
  purchase: MarketplaceParams;

  // Agriculture features & Service requests
  weather_forecast_viewed: AgriFeatureParams;
  weather_view: AgriFeatureParams;
  market_price_viewed: AgriFeatureParams;
  market_prices_view: AgriFeatureParams;
  agricultural_service_viewed: AgriFeatureParams;
  service_request: AgriFeatureParams;
  academy_course_viewed: AgriFeatureParams;
  academy_content_view: AgriFeatureParams;
  community_post_viewed: AgriFeatureParams;
  community_interaction: AgriFeatureParams & { interaction_type?: string };
  ai_assistant_used: AgriFeatureParams;
  ai_assistant_use: AgriFeatureParams;
};

export type AnalyticsEventName = keyof EventParamMap;
