import React, {
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthUser, LoginDto, RegisterUserDto } from '@/types';
import { loginApi, registerUserApi } from '@/services/api/endpoints';
import {
  setApiAuthToken,
  registerUnauthorizedHandler,
} from '@/services/api/client';
import { AuthContext } from './auth-context-def';

/**
 * Storage and Security Trade-off Documentation:
 * By default, this application stores authentication credentials in React in-memory state.
 * To provide a smooth reviewer experience across browser reloads without losing the active session,
 * we mirror session credentials in browser `sessionStorage`.
 *
 * Security Tradeoff:
 * - `sessionStorage` is strictly scoped to the active browser tab (never shared across tabs or windows)
 *   and automatically purged as soon as the tab or window is closed.
 * - In high-security environments, purely in-memory token storage or HttpOnly SameSite cookies
 *   are preferred to guard against arbitrary XSS script injection.
 */
const SESSION_STORAGE_KEY = 'insignia_auth_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed: AuthUser = JSON.parse(stored);
        if (parsed.token && parsed.username) {
          setApiAuthToken(parsed.token);
          return parsed;
        }
      }
    } catch {
      // In case storage is inaccessible or corrupted
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(() => {
    setUser(null);
    setApiAuthToken(null);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    // Clear all TanStack query caches to prevent leakage of private financial information
    queryClient.clear();
  }, [queryClient]);

  // Register the 401 interceptor callback to automatically log out on unauthorized protected requests
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      logout();
    });
  }, [logout]);

  const login = async (credentials: LoginDto) => {
    setIsLoading(true);
    try {
      const response = await loginApi(credentials);
      const role = response.role || response.user?.role || (response.admin ? 'ADMIN' : 'USER');
      const authUser: AuthUser = {
        username: response.user?.username || credentials.username,
        token: response.token,
        role,
        id: response.user?.id || response.admin?.id,
        fullName: response.user?.fullName || response.admin?.fullName,
      };

      setUser(authUser);
      setApiAuthToken(authUser.token);

      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authUser));
      } catch {
        // Storage unavailable
      }
    } finally {
      setIsLoading(false);
    }
  };

  const registerWallet = async (data: RegisterUserDto): Promise<string> => {
    setIsLoading(true);
    try {
      const response = await registerUserApi(data);
      const authUser: AuthUser = {
        username: data.username,
        token: response.token,
        role: 'USER',
        fullName: data.fullName,
      };

      setUser(authUser);
      setApiAuthToken(authUser.token);

      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authUser));
      } catch {
        // Storage unavailable
      }

      return response.token;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user?.token),
        isLoading,
        login,
        registerWallet,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
