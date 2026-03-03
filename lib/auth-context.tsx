import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import {
  apiPost,
  apiGet,
  getSessionToken,
  setSessionToken,
  clearSessionToken,
  clearChatToken,
} from "@/lib/api";

interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  trustLayerId?: string;
  membershipStatus?: string;
  membershipType?: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const token = await getSessionToken();
      if (token) {
        const data = await apiGet<{ user: User }>("/api/auth/me");
        setUser(data.user);
      }
    } catch {
      await clearSessionToken();
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const data = await apiPost<{ user: User; sessionToken: string }>(
      "/api/auth/login",
      { email, password },
      false
    );
    await setSessionToken(data.sessionToken);
    setUser(data.user);
  }

  async function register(email: string, username: string, password: string) {
    const data = await apiPost<{ user: User; sessionToken: string }>(
      "/api/auth/register",
      { email, username, password },
      false
    );
    await setSessionToken(data.sessionToken);
    setUser(data.user);
  }

  async function logout() {
    try {
      await apiPost("/api/auth/logout", undefined, true);
    } catch {}
    await clearSessionToken();
    await clearChatToken();
    setUser(null);
  }

  async function refreshUser() {
    try {
      const data = await apiGet<{ user: User }>("/api/auth/me");
      setUser(data.user);
    } catch {}
  }

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
