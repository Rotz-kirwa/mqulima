import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "./auth-context";
import { type User } from "./auth-types";
import { loginUser, logoutUser, getCurrentUser, registerUser } from "./auth-server";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check current session and initialize CSRF token on mount
  useEffect(() => {
    async function initAuth() {
      try {
        const { ensureCsrfToken } = await import("./csrf-client");
        await ensureCsrfToken();
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
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
      // Fetch full user profile details to ensure consistency
      const currentUser = await getCurrentUser();
      setUser(currentUser);
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
      const currentUser = await getCurrentUser();
      setUser(currentUser);
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
