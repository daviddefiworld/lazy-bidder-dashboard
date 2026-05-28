import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AUTH_TOKEN_STORAGE_KEY } from '../constants/authStorage';
import apiService from '../services/apiService';
import type { AuthUser, DashboardPermission } from '../types/auth';

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  initializing: boolean;
  hasPermission: (permission: DashboardPermission) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState<boolean>(() => Boolean(readStoredToken()));

  const login = useCallback(async (username: string, password: string) => {
    const data = await apiService.login(username, password);
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setInitializing(false);
  }, []);

  React.useEffect(() => {
    if (!token) {
      setInitializing(false);
      setUser(null);
      return;
    }

    let cancelled = false;
    setInitializing(true);

    const hydrateSession = async () => {
      try {
        const session = await apiService.getSession();
        if (cancelled) return;
        setUser(session.user);
      } catch {
        if (cancelled) return;
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    void hydrateSession();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      logout,
      isAuthenticated: Boolean(token),
      initializing,
      hasPermission: (permission: DashboardPermission) =>
        Boolean(user && (user.role === 'admin' || user.permissions.includes(permission))),
    }),
    [token, user, login, logout, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
