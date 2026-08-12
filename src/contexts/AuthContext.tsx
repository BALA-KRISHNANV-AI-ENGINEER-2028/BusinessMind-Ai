/**
 * Production Auth Context Provider.
 *
 * Connects frontend state to real backend Auth API endpoints while providing
 * automatic session persistence and expiration checking.
 *
 * ── Rules ──────────────────────────────────────────────────────────────────
 * - No mock/dummy fallbacks. An API failure is a real error.
 * - Initial state is null (unauthenticated) when localStorage is empty.
 * - Google OAuth is handled via backend redirect flow (loginWithGoogle
 *   redirects the browser; state is set by OAuthCallbackPage on return).
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthSession, AuthState, User } from '../types/auth';
import { authApi } from '../services/auth.api';
import type { RegisterPayload, CompleteOnboardingPayload } from '../services/auth.api';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  completeGoogleOnboarding: (payload: CompleteOnboardingPayload) => Promise<void>;
  loginWithGoogle: () => void;
  setSessionFromCallback: (session: AuthSession) => void;
  updateUser: (updatedUser: Partial<User>) => void;
  logout: () => void;
  checkSessionExpiration: () => boolean;
}

const STORAGE_KEY = 'businessmind_auth_session';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthSession;
        // Only restore session if it has not expired
        if (parsed.expiresAt > Date.now()) {
          return parsed;
        }
        // Expired session — clear it
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to parse auth session from localStorage', e);
      localStorage.removeItem(STORAGE_KEY);
    }
    // No valid session in storage → start unauthenticated
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  // Re-hydrate session from MongoDB backend on mount to ensure fresh profile data
  useEffect(() => {
    if (!session) return;
    authApi
      .getMe()
      .then((freshSession) => {
        if (freshSession && freshSession.user) {
          setSession(freshSession);
        }
      })
      .catch(() => {
        // Token invalid or session expired on backend
        setSession(null);
        localStorage.removeItem(STORAGE_KEY);
      });
  }, []);

  const checkSessionExpiration = (): boolean => {
    if (!session) return true;
    if (Date.now() >= session.expiresAt) {
      setSession(null);
      return true;
    }
    return false;
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const realSession = await authApi.login({ email, password });
      setSession(realSession);
    } catch (err) {
      const message = (err as Error).message || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const newSession = await authApi.register(payload);
      setSession(newSession);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const completeGoogleOnboarding = async (payload: CompleteOnboardingPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const newSession = await authApi.completeOnboarding(payload);
      setSession(newSession);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Redirects the browser to the backend Google OAuth initiation endpoint.
   * The backend handles the full OAuth flow and redirects back to
   * /auth/callback with the session token, which OAuthCallbackPage reads.
   */
  const loginWithGoogle = () => {
    authApi.initiateGoogleOAuth();
  };

  /**
   * Called by OAuthCallbackPage after a successful Google OAuth redirect.
   * Sets the session in context and localStorage.
   */
  const setSessionFromCallback = (newSession: AuthSession) => {
    setSession(newSession);
  };

  /**
   * Immediately updates current user object in state and localStorage.
   */
  const updateUser = (updatedUser: Partial<User>) => {
    setSession((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        user: {
          ...prev.user,
          ...updatedUser,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    void authApi.logout().catch(() => {});
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      isAuthenticated: Boolean(session && session.expiresAt > Date.now()),
      isLoading,
      error,
      login,
      register,
      completeGoogleOnboarding,
      loginWithGoogle,
      setSessionFromCallback,
      updateUser,
      logout,
      checkSessionExpiration,
    }),
    [session, isLoading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
