import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "./auth-context";
import { type User } from "./auth-types";
import { loginUser, logoutUser, getCurrentUser, registerUser } from "./auth-server";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("mqulima_user_account");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check current session and initialize CSRF token on mount
  useEffect(() => {
    async function initAuth() {
      try {
        const { ensureCsrfToken } = await import("./csrf-client");
        await ensureCsrfToken();
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          if (typeof window !== "undefined") {
            localStorage.setItem("mqulima_user_account", JSON.stringify(currentUser));
          }
        }
      } catch (error) {
        // Keep cached user on transient network failure
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = useCallback(async (identifier: string, password: string, rememberMe?: boolean) => {
    const { ensureCsrfToken } = await import("./csrf-client");
    const csrfToken = await ensureCsrfToken();
    const response = await loginUser({ data: { identifier, password, csrfToken, rememberMe } });
    if (response && response.success) {
      let currentUser: User | null = null;
      try {
        currentUser = await getCurrentUser();
      } catch (e) {}

      const finalUser: User = currentUser || {
        id: response.user?.id || "user",
        name: response.user?.name || "Farmer",
        email: response.user?.email || identifier,
        county: "",
        farmSize: "",
        crops: "",
        livestock: "",
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
      let currentUser: User | null = null;
      try {
        currentUser = await getCurrentUser();
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
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("mqulima_user_account");
        localStorage.removeItem("mqulima_post_draft");
        sessionStorage.clear();
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}
