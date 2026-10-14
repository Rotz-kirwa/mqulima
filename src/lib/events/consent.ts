import { ConsentPreferences, GoogleConsentState } from "./types";

const CONSENT_STORAGE_KEY = "mqulima_analytics_consent_v2";
const CONSENT_CHANGE_EVENT = "mqulima_consent_changed";

export const DEFAULT_CONSENT: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  updatedAt: 0,
  version: 2,
};

let memoryConsent: ConsentPreferences | null = null;

/**
 * Retrieves the user's stored consent preferences, or null if undecided.
 */
export function getStoredConsent(): ConsentPreferences | null {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === 2) {
          memoryConsent = parsed as ConsentPreferences;
          return parsed as ConsentPreferences;
        }
      } else {
        memoryConsent = null;
        return null;
      }
    } catch (err) {
      console.warn("[Consent] Failed to read localStorage:", err);
    }
  }
  return memoryConsent;
}

/**
 * Checks if the user has explicitly granted analytics consent.
 */
export function hasAnalyticsConsent(): boolean {
  const stored = getStoredConsent();
  return Boolean(stored && stored.analytics);
}

/**
 * Checks if the user has explicitly granted marketing/campaign consent.
 */
export function hasMarketingConsent(): boolean {
  const stored = getStoredConsent();
  return Boolean(stored && stored.marketing);
}

/**
 * Updates Google Consent Mode v2 via gtag('consent', 'update', ...).
 */
export function syncGoogleConsentMode(prefs: ConsentPreferences): void {
  if (typeof window === "undefined") return;

  const consentPayload: GoogleConsentState = {
    analytics_storage: prefs.analytics ? "granted" : "denied",
    ad_storage: prefs.marketing ? "granted" : "denied",
    ad_user_data: prefs.marketing ? "granted" : "denied",
    ad_personalization: prefs.marketing ? "granted" : "denied",
  };

  if (typeof (window as any).gtag === "function") {
    (window as any).gtag("consent", "update", consentPayload);
  }
}

/**
 * Saves consent preferences, updates Google Consent Mode, and dispatches a change event.
 */
export function saveConsentPreferences(
  prefs: Omit<ConsentPreferences, "necessary" | "updatedAt" | "version">
): ConsentPreferences {
  const fullPrefs: ConsentPreferences = {
    necessary: true,
    analytics: Boolean(prefs.analytics),
    marketing: Boolean(prefs.marketing),
    updatedAt: Date.now(),
    version: 2,
  };

  memoryConsent = fullPrefs;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(fullPrefs));
    } catch (err) {
      console.warn("[Consent] Failed to write localStorage:", err);
    }

    syncGoogleConsentMode(fullPrefs);

    // Notify active listeners across tabs and components
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent(CONSENT_CHANGE_EVENT, { detail: fullPrefs })
      );
    }
  }

  return fullPrefs;
}

/**
 * Convenience helper to accept all optional cookies.
 */
export function acceptAllConsent(): ConsentPreferences {
  return saveConsentPreferences({ analytics: true, marketing: true });
}

/**
 * Convenience helper to reject all optional cookies.
 */
export function rejectOptionalConsent(): ConsentPreferences {
  return saveConsentPreferences({ analytics: false, marketing: false });
}

/**
 * Subscribe to consent updates.
 */
export function onConsentChange(callback: (prefs: ConsentPreferences) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const listener = (event: Event) => {
    const custom = event as CustomEvent<ConsentPreferences>;
    if (custom.detail) callback(custom.detail);
  };

  window.addEventListener(CONSENT_CHANGE_EVENT, listener);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, listener);
}
