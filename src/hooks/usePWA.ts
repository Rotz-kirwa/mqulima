import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

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

export function usePWA() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== "undefined" ? navigator.onLine : true,
  );
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default",
  );

  // Monitor network status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      toast.success("You are back online. Synced successfully!", {
        description: "Your connection to Mqulima has been restored.",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You are currently offline.", {
        description: "Some features may be limited, but you can still access cached pages.",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check for standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as NavigatorWithStandalone).standalone ||
      document.referrer.includes("android-app://");
    setIsInstalled(isStandalone);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Capture install prompt
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast.success("Mqulima App Installed!", {
        description: "You can now access Mqulima directly from your home screen.",
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Service worker registration
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const isDev =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    if (isDev) {
      // In development mode, unregister any active service worker to avoid conflicts with Vite's HMR
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((success) => {
            if (success) {
              console.log("Development mode: Unregistered active Service Worker");
            }
          });
        }
      });
      return;
    }

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
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }
  }, []);

  // Trigger installation
  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) {
      toast.error("Install prompt not available. Please install via browser menu.");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      toast.success("Thank you for installing Mqulima!");
      setIsInstalled(true);
      setIsInstallable(false);
    } else {
      toast.info("Install dismissed. You can install anytime from the header.");
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  // Request notifications permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Notifications are not supported in this browser.");
      return "default";
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

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
    isOnline,
    isInstallable,
    isInstalled,
    triggerInstall,
    notificationPermission,
    requestNotificationPermission,
  };
}
