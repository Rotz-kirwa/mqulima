import { getStoredConsent, syncGoogleConsentMode } from "./consent";

let isGaInitialized = false;
let isClarityInitialized = false;

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
    clarity?: (...args: any[]) => void;
  }
}

export const PRODUCTION_GA_MEASUREMENT_ID = "G-G1QQTG8YJT";

/**
 * Returns the configured GA4 Measurement ID from Vite client environment or default production ID.
 */
export function getMeasurementId(): string | null {
  if (typeof window === "undefined") return null;
  const envId = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID;
  if (typeof envId === "string" && envId.trim().startsWith("G-")) {
    return envId.trim();
  }
  return PRODUCTION_GA_MEASUREMENT_ID;
}

/**
 * Determines whether GA4 tracking should actively send hits to Google servers.
 * Prevents automated tests and local dev from polluting live production metrics unless opted in.
 */
export function isTrackingEnabled(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Never send live hits during test runs
  if ((import.meta as any).env?.MODE === "test") {
    return false;
  }

  // 2. On localhost / loopback, only send if explicitly enabled
  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
  if (isLocalhost) {
    const isDevEnabled =
      (import.meta as any).env?.VITE_ENABLE_DEV_ANALYTICS === "true" ||
      (import.meta as any).env?.VITE_ENABLE_DEV_ANALYTICS === true ||
      (typeof window.location.search === "string" && window.location.search.includes("ga_debug=true"));
    return Boolean(isDevEnabled);
  }

  // 3. Active in production and preview deployments
  return true;
}

/**
 * Returns optional Clarity Project ID if configured.
 */
export function getClarityProjectId(): string | null {
  if (typeof window === "undefined") return null;
  const id = (import.meta as any).env?.VITE_CLARITY_PROJECT_ID;
  return typeof id === "string" && id.trim().length > 0 ? id.trim() : null;
}

/**
 * Initializes Google Tag (gtag.js) with Google Consent Mode v2 and manual page-view control.
 * Safely guards against server-side rendering, duplicate script tags, duplicate initialization,
 * and adblocker interception.
 */
export function initGoogleAnalytics(): boolean {
  if (typeof window === "undefined") return false;
  if (isGaInitialized) return true;

  const measurementId = getMeasurementId();
  if (!measurementId) return false;

  // 1. Prepare dataLayer & gtag stub
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  // 2. Configure Google Consent Mode v2 DEFAULT states before script execution
  const currentConsent = getStoredConsent();
  const defaultAnalytics = currentConsent?.analytics ? "granted" : "denied";
  const defaultMarketing = currentConsent?.marketing ? "granted" : "denied";

  window.gtag("consent", "default", {
    analytics_storage: defaultAnalytics,
    ad_storage: defaultMarketing,
    ad_user_data: defaultMarketing,
    ad_personalization: defaultMarketing,
    wait_for_update: 500,
  });

  // Guard against environments where tracking should be in simulation mode
  if (!isTrackingEnabled()) {
    if ((import.meta as any).env?.DEV) {
      console.info(
        `[GA4 Info] Tracking paused on ${window.location.hostname}. Add ?ga_debug=true or VITE_ENABLE_DEV_ANALYTICS=true to send live hits to ${measurementId}.`
      );
    }
    isGaInitialized = true;
    return true;
  }

  // 3. Inject gtag.js script if not present (with safe DOM check & error guard)
  const scriptId = "google-analytics-gtag-script";
  if (
    typeof document !== "undefined" &&
    typeof document.getElementById === "function" &&
    !document.getElementById(scriptId)
  ) {
    if (typeof document.createElement === "function" && document.head && typeof document.head.appendChild === "function") {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      script.onerror = () => {
        // Silently tolerate adblockers blocking external CDN
      };
      document.head.appendChild(script);
    }
  }

  // 4. Initial config call
  const isDev = Boolean((import.meta as any).env?.DEV);
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    // Disable automatic page views to prevent double counting with TanStack Router
    send_page_view: false,
    debug_mode: isDev,
  });

  // 5. Update consent if stored preferences already exist
  if (currentConsent) {
    syncGoogleConsentMode(currentConsent);
  }

  isGaInitialized = true;

  // 6. Optional Session Replay (Microsoft Clarity, privacy-screened)
  initClarityIfConfigured();

  return true;
}

/**
 * Initializes Microsoft Clarity session replay if configured and analytics consent is granted.
 */
export function initClarityIfConfigured(): boolean {
  if (typeof window === "undefined") return false;
  if (isClarityInitialized) return true;

  const clarityId = getClarityProjectId();
  if (!clarityId) return false;

  const consent = getStoredConsent();
  if (!consent?.analytics) return false;

  const scriptId = "ms-clarity-script";
  if (!document.getElementById(scriptId)) {
    (function (c: any, l: any, a: any, r: any, i: any) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      const t = l.createElement(r);
      t.id = scriptId;
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      t.onerror = () => {};
      const y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", clarityId);

    isClarityInitialized = true;
  }

  return true;
}
