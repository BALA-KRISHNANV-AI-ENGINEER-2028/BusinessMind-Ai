import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, UserPreferences } from '../types/auth';
import { mockUser } from '../mocks/auth.mock';

interface UserContextValue {
  user: User | null;
  preferences: UserPreferences;
  updateProfile: (data: Partial<Omit<User, 'id' | 'preferences'>>) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(mockUser);

  const updateProfile = (data: Partial<Omit<User, 'id' | 'preferences'>>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          ...prefs,
        },
      };
    });
  };

  const preferences = useMemo(
    () =>
      user?.preferences ?? {
        timezone: 'et',
        language: 'en-US',
        emailNotifications: true,
        marketingEmails: false,
      },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      preferences,
      updateProfile,
      updatePreferences,
    }),
    [user, preferences],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
