import { useState, useEffect, useCallback } from "react";
import { toast } from "@/lib/toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

let hasInitializedPWA = false;
let hasRegisteredSW = false;

type PWAState = {
  isOnline: boolean;
  isInstallable: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  notificationPermission: NotificationPermission;
};

const pwaState: PWAState = {
  isOnline: true,
  isInstallable: false,
  deferredPrompt: null,
  isInstalled: false,
  notificationPermission: "default",
};

const listeners = new Set<() => void>();

function notifyPWA() {
  listeners.forEach((fn) => fn());
}

function shouldDeferInstallPrompt(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const isDismissed = localStorage.getItem("mq_pwa_banner_dismissed") === "true";
    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
    // Only intercept Chrome's mini-infobar when our mobile custom install banner is eligible;
    // otherwise let the browser handle install natively without suppressed-banner console noise.
    return isMobileViewport && !isDismissed;
  } catch {
    return false;
  }
}

function initPWASingleton() {
  if (hasInitializedPWA || typeof window === "undefined") return;
  hasInitializedPWA = true;

  pwaState.isOnline = navigator.onLine;
  if ("Notification" in window) {
    pwaState.notificationPermission = Notification.permission;
  }
  pwaState.isInstalled =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as NavigatorWithStandalone).standalone ||
    document.referrer.includes("android-app://");

  window.addEventListener("online", () => {
    pwaState.isOnline = true;
    notifyPWA();
    toast.success("You are back online. Synced successfully!", {
      description: "Your connection to Mqulima has been restored.",
    });
  });

  window.addEventListener("offline", () => {
    pwaState.isOnline = false;
    notifyPWA();
    toast.warning("You are currently offline.", {
      description: "Some features may be limited, but you can still access cached pages.",
    });
  });

  window.addEventListener("beforeinstallprompt", (e: BeforeInstallPromptEvent) => {
    if (!shouldDeferInstallPrompt()) {
      return;
    }
    e.preventDefault();
    pwaState.deferredPrompt = e;
    pwaState.isInstallable = true;
    notifyPWA();
  });

  window.addEventListener("appinstalled", () => {
    pwaState.isInstalled = true;
    pwaState.isInstallable = false;
    pwaState.deferredPrompt = null;
    notifyPWA();
    toast.success("Mqulima App Installed!", {
      description: "You can now access Mqulima directly from your home screen.",
    });
  });

  if ("serviceWorker" in navigator && !hasRegisteredSW) {
    hasRegisteredSW = true;
    const isDev =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    if (isDev) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((success) => {
            if (success) {
              console.log("Development mode: Unregistered active Service Worker");
            }
          });
        }
      });
    } else {
      const registerSW = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.error("Service Worker registration failed:", error);
          });
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW, { once: true });
      }
    }
  }
}

export function usePWA() {
  const [, setTick] = useState(0);

  useEffect(() => {
    initPWASingleton();
    const onChange = () => setTick((n) => n + 1);
    listeners.add(onChange);
    // Sync state immediately in case singleton initialized earlier
    onChange();
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  // Trigger installation
  const triggerInstall = useCallback(async () => {
    const promptEvent = pwaState.deferredPrompt;
    if (!promptEvent) {
      toast.error("Install prompt not available. Please install via browser menu.");
      return;
    }

    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;

    if (outcome === "accepted") {
      toast.success("Thank you for installing Mqulima!");
      pwaState.isInstalled = true;
      pwaState.isInstallable = false;
    } else {
      toast.info("Install dismissed. You can install anytime from the header.");
    }
    pwaState.deferredPrompt = null;
    notifyPWA();
  }, []);

  // Request notifications permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Notifications are not supported in this browser.");
      return "default";
    }

    try {
      const permission = await Notification.requestPermission();
      pwaState.notificationPermission = permission;
      notifyPWA();

      if (permission === "granted") {
        toast.success("Notifications enabled!", {
          description: "You will now receive timely alerts and notifications.",
        });

        // Show simulated greeting notification
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification("Karibu Mqulima!", {
              body: "Thank you for enabling alerts. We will keep you updated on weather, markets, and crop health.",
              icon: "/icon-192.png",
              badge: "/icon-192.png",
            });
          });
        }
      } else if (permission === "denied") {
        toast.error("Notifications blocked.", {
          description: "Please update your browser settings to enable Mqulima alerts.",
        });
      }
      return permission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "default";
    }
  }, []);

  return {
    isOnline: pwaState.isOnline,
    isInstallable: pwaState.isInstallable,
    isInstalled: pwaState.isInstalled,
    triggerInstall,
    notificationPermission: pwaState.notificationPermission,
    requestNotificationPermission,
  };
}
