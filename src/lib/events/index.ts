import { AnalyticsEventName, EventParamMap } from "./types";
import { hasAnalyticsConsent } from "./consent";
import { sanitizeEventPayload, sanitizeUrl } from "./sanitizer";
import { initGoogleAnalytics } from "./provider";

export * from "./types";
export * from "./consent";
export * from "./sanitizer";
export * from "./provider";

/**
 * Maps domain events to official Google Analytics 4 recommended events.
 */
function dispatchRecommendedGA4Events(eventName: string, cleanPayload: Record<string, any>): void {
  if (typeof (window as any).gtag !== "function") return;
  const gtag = (window as any).gtag;

  switch (eventName) {
    case "sign_up_completed":
    case "sign_up":
      if (eventName !== "sign_up") {
        gtag("event", "sign_up", {
          method: cleanPayload.method || "credentials",
        });
      }
      break;

    case "login_completed":
    case "login":
      if (eventName !== "login") {
        gtag("event", "login", {
          method: cleanPayload.method || "credentials",
        });
      }
      break;

    case "site_search":
    case "product_search_performed":
    case "search":
      if (eventName !== "search") {
        gtag("event", "search", {
          search_term: cleanPayload.search_term,
        });
      }
      break;

    case "contact_form_submitted":
    case "quotation_requested":
    case "generate_lead":
      if (eventName !== "generate_lead") {
        gtag("event", "generate_lead", {
          value: cleanPayload.value || cleanPayload.transaction_value || 0,
          currency: cleanPayload.currency || "KES",
          lead_type: cleanPayload.form_name || cleanPayload.service_name || "general_inquiry",
        });
      }
      break;

    case "product_viewed":
    case "view_item":
      if (eventName !== "view_item") {
        gtag("event", "view_item", {
          currency: cleanPayload.currency || "KES",
          value: cleanPayload.price || cleanPayload.value || 0,
          items: [
            {
              item_id: cleanPayload.product_id || cleanPayload.id || "",
              item_name: cleanPayload.product_name || cleanPayload.name || "",
              item_category: cleanPayload.product_category || cleanPayload.category || "General",
              price: cleanPayload.price || cleanPayload.value || 0,
              quantity: cleanPayload.quantity || 1,
            },
          ],
        });
      }
      break;

    case "marketplace_opened":
    case "product_category_selected":
    case "view_item_list":
      if (eventName !== "view_item_list") {
        gtag("event", "view_item_list", {
          item_list_name: cleanPayload.category || cleanPayload.category_name || "AgroShop Catalog",
          item_list_id: cleanPayload.product_category || "all_products",
        });
      }
      break;

    case "add_to_cart":
      gtag("event", "add_to_cart", {
        currency: cleanPayload.currency || "KES",
        value: cleanPayload.price || cleanPayload.value || 0,
        items: [
          {
            item_id: cleanPayload.product_id || cleanPayload.id || "",
            item_name: cleanPayload.product_name || cleanPayload.name || "",
            item_category: cleanPayload.product_category || cleanPayload.category || "General",
            price: cleanPayload.price || cleanPayload.value || 0,
            quantity: cleanPayload.quantity || 1,
          },
        ],
      });
      break;

    case "checkout_started":
    case "begin_checkout":
      if (eventName !== "begin_checkout") {
        gtag("event", "begin_checkout", {
          currency: cleanPayload.currency || "KES",
          value: cleanPayload.cart_total || cleanPayload.value || 0,
          items: cleanPayload.items || [],
        });
      }
      break;

    case "purchase_completed":
    case "purchase":
      if (eventName !== "purchase") {
        gtag("event", "purchase", {
          transaction_id: cleanPayload.order_id || cleanPayload.transaction_id || `ORD-${Date.now()}`,
          value: cleanPayload.transaction_value || cleanPayload.value || 0,
          currency: cleanPayload.transaction_currency || cleanPayload.currency || "KES",
          items: cleanPayload.items || [],
        });
      }
      break;

    case "weather_forecast_viewed":
    case "weather_view":
      if (eventName !== "weather_view") {
        gtag("event", "weather_view", {
          county: cleanPayload.county || "Kenya",
          region: cleanPayload.region || "",
        });
      }
      break;

    case "market_price_viewed":
    case "market_prices_view":
      if (eventName !== "market_prices_view") {
        gtag("event", "market_prices_view", {
          commodity_name: cleanPayload.commodity_name || "",
          market_location: cleanPayload.market_location || "",
        });
      }
      break;

    case "ai_assistant_used":
    case "ai_assistant_use":
      if (eventName !== "ai_assistant_use") {
        gtag("event", "ai_assistant_use", {
          feature_name: cleanPayload.feature_name || "chat",
          query_category: cleanPayload.query_category || "",
        });
      }
      break;

    case "community_post_viewed":
    case "community_interaction":
      if (eventName !== "community_interaction") {
        gtag("event", "community_interaction", {
          interaction_type: "view_post",
          post_category: cleanPayload.post_category || "",
          post_id: cleanPayload.post_id || "",
        });
      }
      break;

    case "academy_course_viewed":
    case "academy_content_view":
      if (eventName !== "academy_content_view") {
        gtag("event", "academy_content_view", {
          course_id: cleanPayload.course_id || "",
          course_title: cleanPayload.course_title || "",
          course_category: cleanPayload.course_category || "",
        });
      }
      break;

    case "agricultural_service_viewed":
    case "service_request":
      if (eventName !== "service_request") {
        gtag("event", "service_request", {
          service_id: cleanPayload.service_id || "",
          service_name: cleanPayload.service_name || "",
          service_category: cleanPayload.service_category || "",
        });
      }
      break;
  }
}

/**
 * Tracks a typed custom event to Google Analytics 4.
 *
 * Rules:
 * - Emits only in browser.
 * - Respects analytics consent preferences.
 * - Automatically scrubs potential PII (emails, phone numbers, passwords, auth tokens).
 * - Normalizes to official GA4 recommended e-commerce and conversion events where applicable.
 * - Fail-safe: silently catches any error and never interferes with app functionality.
 */
export function trackEvent<E extends AnalyticsEventName>(
  eventName: E,
  params?: EventParamMap[E]
): void {
  if (typeof window === "undefined") return;

  try {
    // Initialize provider if needed
    initGoogleAnalytics();

    // Guard against rejected or ungranted consent
    if (!hasAnalyticsConsent()) {
      return;
    }

    const cleanPayload = sanitizeEventPayload(params || {});

    if (typeof (window as any).gtag === "function") {
      (window as any).gtag("event", eventName, cleanPayload);
      dispatchRecommendedGA4Events(eventName, cleanPayload);
    }

    if ((import.meta as any).env?.DEV) {
      console.debug(`[GA4 Event] %c${eventName}`, "color: #10b981; font-weight: bold;", cleanPayload);
    }
  } catch (err) {
    // Fail-safe: tracking should never throw or block UI
    if ((import.meta as any).env?.DEV) {
      console.warn(`[Event Dispatch Error] Failed to track ${eventName}:`, err);
    }
  }
}

/**
 * Tracks a page_view event specifically for client-side navigation.
 * Sanitizes URLs to remove sensitive tokens while preserving UTM tags.
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (typeof window === "undefined") return;

  try {
    initGoogleAnalytics();

    if (!hasAnalyticsConsent()) {
      return;
    }

    const normalizedPath = pagePath.startsWith("/") ? pagePath : `/${pagePath}`;
    const rawLocation = window.location.href;
    const pageLocation = sanitizeUrl(rawLocation);
    const title = pageTitle || document.title || "Mqulima Hub";

    // Derive page category from path
    const segments = normalizedPath.split("/").filter(Boolean);
    const pageCategory = segments[0] ? segments[0].toLowerCase() : "home";

    const payload = {
      page_path: normalizedPath,
      page_location: pageLocation,
      page_title: title,
      page_category: pageCategory,
    };

    if (typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "page_view", payload);
    }

    if ((import.meta as any).env?.DEV) {
      console.debug("[GA4 PageView]", payload);
    }
  } catch (err) {
    // Fail-safe
  }
}
