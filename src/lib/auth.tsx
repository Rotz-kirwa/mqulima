import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "./auth-context";
import { type User } from "./auth-types";
import { loginUser, logoutUser, getCurrentUser, registerUser } from "./auth-server";
import { trackEvent } from "./events";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check current session and initialize CSRF token on mount, and resync when returning to tab
  useEffect(() => {
    let cancelled = false;
    let lastSyncedAt = 0;

    async function syncSession(initialMount: boolean) {
      const now = Date.now();
      if (!initialMount && now - lastSyncedAt < 8000) return;
      lastSyncedAt = now;

      try {
        if (initialMount) {
          const { ensureCsrfToken } = await import("./csrf-client");
          await ensureCsrfToken();
        }

        const storedToken = typeof window !== "undefined" ? localStorage.getItem("mq_token") : null;
        const cachedAccount = typeof window !== "undefined" ? localStorage.getItem("mqulima_user_account") : null;

        // Clean any legacy non-profile object written by older checkout versions (missing .id)
        if (cachedAccount && typeof window !== "undefined") {
          try {
            const parsed = JSON.parse(cachedAccount);
            if (!parsed || !parsed.id) {
              localStorage.removeItem("mqulima_user_account");
            }
          } catch {
            localStorage.removeItem("mqulima_user_account");
          }
        }

        let currentUser: User | null = null;
        try {
          currentUser = await getCurrentUser({ data: { token: storedToken || undefined } });
        } catch (fetchErr) {
          if (initialMount) {
            console.warn("Session verification network blip:", fetchErr);
          }
          return;
        }

        if (cancelled) return;

        if (currentUser) {
          setUser(currentUser);
          if (typeof window !== "undefined") {
            localStorage.setItem("mqulima_user_account", JSON.stringify(currentUser));
          }
        } else if (storedToken) {
          // Token was explicitly provided but invalidated/expired by server
          setUser(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("mqulima_user_account");
            localStorage.removeItem("mq_token");
          }
        } else if (initialMount && cachedAccount) {
          // Keep verified cached user on transient offline/cookie issues
          try {
            const parsed = JSON.parse(cachedAccount);
            if (parsed && parsed.id) {
              setUser(parsed);
            }
          } catch {}
        } else if (initialMount) {
          setUser(null);
        }
      } catch {
        // Keep cached user on transient network failure
      } finally {
        if (initialMount && !cancelled) setIsLoading(false);
      }
    }

    syncSession(true);

    const onFocusOrVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      syncSession(false);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "mqulima_user_account" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.id) setUser(parsed);
        } catch {}
      } else if (e.key === "mqulima_user_account" && !e.newValue) {
        setUser(null);
      }
    };

    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string, rememberMe?: boolean) => {
    const { ensureCsrfToken } = await import("./csrf-client");
    const csrfToken = await ensureCsrfToken();
    const response = await loginUser({ data: { identifier, password, csrfToken, rememberMe } });
    if (response && response.success) {
      if (response.token && typeof window !== "undefined") {
        localStorage.setItem("mq_token", response.token);
      }

      let currentUser: User | null = null;
      try {
        currentUser = await getCurrentUser({ data: { token: response.token } });
      } catch (e) {}

      const finalUser: User = currentUser || {
        id: response.user?.id || "user",
        name: response.user?.name || "Farmer",
        email: response.user?.email || identifier,
        phone: (response.user as any)?.phone || "",
        county: response.user?.county || "",
        farmSize: response.user?.farmSize || "",
        yearsFarming: (response.user as any)?.yearsFarming || 0,
        avatarUrl: (response.user as any)?.avatarUrl || "",
        username: (response.user as any)?.username || "",
        crops: response.user?.crops || "",
        livestock: response.user?.livestock || "",
        role: (response.user?.role as any) || "farmer",
      };

      setUser(finalUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("mqulima_user_account", JSON.stringify(finalUser));
      }
      return true;
    }
    return false;
  }, []);

  const register = useCallback(async (signUpData: any) => {
    const { ensureCsrfToken } = await import("./csrf-client");
    const csrfToken = await ensureCsrfToken();
    const response = await registerUser({
      data: {
        data: signUpData,
        csrfToken
      }
    });
    if (response && response.success) {
      if (response.token && typeof window !== "undefined") {
        localStorage.setItem("mq_token", response.token);
      }

      let currentUser: User | null = null;
      try {
        currentUser = await getCurrentUser({ data: { token: response.token } });
      } catch (e) {}

      const finalUser: User = currentUser || (response.user as User) || {
        id: response.userId || "user",
        name: `${signUpData.firstName || ""} ${signUpData.lastName || ""}`.trim(),
        email: signUpData.email?.toLowerCase() || "",
        county: signUpData.county || "",
        farmSize: "",
        crops: "",
        livestock: "",
        role: "farmer",
      };

      setUser(finalUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("mqulima_user_account", JSON.stringify(finalUser));
      }
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(async () => {
    try {
      const { ensureCsrfToken } = await import("./csrf-client");
      const csrfToken = await ensureCsrfToken();
      await logoutUser({ data: { csrfToken: csrfToken || "" } });
    } catch (error) {
      console.error("Logout server error:", error);
    } finally {
      trackEvent("logout_completed");
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("mqulima_user_account");
        localStorage.removeItem("mq_token");
        localStorage.removeItem("mqulima_post_draft");
        sessionStorage.clear();
      }
    }
  }, []);

  const updateUser = useCallback((partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("mqulima_user_account", JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
