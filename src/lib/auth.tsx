import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "./auth-context";
import { type User } from "./auth-types";

const STORAGE_KEY = "mqulima_user";

// Demo accounts. In production this is handled by a real identity provider.
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  "john@mqulima.co.ke": {
    password: "farmer123",
    user: {
      id: "u1",
      name: "John Kipchirchir",
      email: "john@mqulima.co.ke",
      county: "Uasin Gishu",
      farmSize: "4 acres",
      crops: "Maize, Beans",
      livestock: "3 dairy cows",
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const account = DEMO_USERS[email.toLowerCase().trim()];
    if (!account || account.password !== password) {
      return false;
    }
    setUser(account.user);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(account.user));
    }
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
