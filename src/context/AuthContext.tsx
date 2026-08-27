"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, clearToken, getToken, setToken } from "@/lib/api";
import type { CodeResponse, UserResponse } from "@/lib/types";

interface AuthContextValue {
  user: UserResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  requestLoginCode: (email: string) => Promise<CodeResponse>;
  loginWithCode: (email: string, code: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = getToken();
      if (!token) return null;
      try {
        return await api.getMe();
      } catch {
        clearToken();
        return null;
      }
    })().then((me) => {
      if (cancelled) return;
      setUser(me);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fired by the api client when a request comes back 401 — the token is
  // expired/invalid, so drop the cached user immediately.
  useEffect(() => {
    const onUnauthorized = () => {
      clearToken();
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("uniswap:unauthorized", onUnauthorized);
    return () => window.removeEventListener("uniswap:unauthorized", onUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const requestLoginCode = useCallback(
    (email: string) => api.requestLoginCode(email),
    []
  );

  const loginWithCode = useCallback(async (email: string, code: string) => {
    const res = await api.loginWithCode(email, code);
    setToken(res.token);
    setUser(res.user);
  }, []);

  // Re-fetches the current user from the token already in localStorage. Used
  // by the OAuth callback after it stores the fresh token — without this the
  // navbar stays "logged out" until a full page reload.
  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await api.getMe();
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, requestLoginCode, loginWithCode, refreshUser, logout }),
    [user, loading, login, requestLoginCode, loginWithCode, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
