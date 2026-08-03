import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthSession, AuthState } from '../types/auth';
import { mockSession } from '../mocks/auth.mock';

interface AuthContextValue extends AuthState {
  login: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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
        if (parsed.expiresAt > Date.now()) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse auth session from localStorage', e);
    }
    return mockSession; // Default logged in for preview
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

  const checkSessionExpiration = (): boolean => {
    if (!session) return true;
    if (Date.now() >= session.expiresAt) {
      setSession(null);
      return true;
    }
    return false;
  };

  const login = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const newSession: AuthSession = {
        ...mockSession,
        user: {
          ...mockSession.user,
          email,
          fullName: email.split('@')[0].replace('.', ' '),
        },
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };
      setSession(newSession);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const googleSession: AuthSession = {
        ...mockSession,
        user: {
          ...mockSession.user,
          email: 'alex.rivera.google@businessmind.ai',
          fullName: 'Alex Rivera (Google)',
        },
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };
      setSession(googleSession);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
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
      loginWithGoogle,
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
