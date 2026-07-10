import { createContext } from "react";
import { type User } from "./auth-types";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  register: (data: any) => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
