import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "./auth-context";
import { type User } from "./auth-types";
import { loginUser, logoutUser, getCurrentUser, registerUser } from "./auth-server";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check current session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkSession();
  }, []);

  const login = useCallback(async (identifier: string, password: string, rememberMe?: boolean) => {
    const { getCsrfTokenFromCookie } = await import("./csrf-client");
    const response = await loginUser({ data: { identifier, password, csrfToken: getCsrfTokenFromCookie(), rememberMe } });
    if (response && response.success) {
      // Fetch full user profile details to ensure consistency
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return true;
    }
    return false;
  }, []);

  const register = useCallback(async (signUpData: any) => {
    const { getCsrfTokenFromCookie } = await import("./csrf-client");
    const response = await registerUser({
      data: {
        data: signUpData,
        csrfToken: getCsrfTokenFromCookie()
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
      const { getCsrfTokenFromCookie } = await import("./csrf-client");
      await logoutUser({ data: { csrfToken: getCsrfTokenFromCookie() } });
    } catch (error) {
      // Ignore
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}
