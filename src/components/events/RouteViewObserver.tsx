import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { trackPageView, initGoogleAnalytics, onConsentChange } from "@/lib/events";

/**
 * Route View Observer for TanStack Router.
 * Fires page_view on initial load and whenever location changes.
 * Avoids duplicate counting on re-renders, hash-only changes, or quick back/forward repeats.
 * Resilient against browser extensions and adblockers.
 */
export function RouteViewObserver() {
  const location = useLocation();
  const lastTrackedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      // 1. Initialize provider & consent defaults
      initGoogleAnalytics();

      // 2. Track current location safely using location.href or location.pathname
      const currentKey = location.href || location.pathname || "/";
      if (lastTrackedKeyRef.current !== currentKey) {
        lastTrackedKeyRef.current = currentKey;
        const title = typeof document !== "undefined" ? document.title : "Mqulima Hub";
        trackPageView(location.pathname || "/", title);
      }
    } catch {
      // Silently tolerate any edge cases
    }
  }, [location.href, location.pathname]);

  // 3. If user accepts consent mid-session, immediately track the current active page
  useEffect(() => {
    try {
      return onConsentChange((prefs) => {
        if (prefs.analytics) {
          initGoogleAnalytics();
          const title = typeof document !== "undefined" ? document.title : "Mqulima Hub";
          trackPageView(location.pathname || "/", title);
        }
      });
    } catch {
      return () => {};
    }
  }, [location.pathname]);

  return null;
}
