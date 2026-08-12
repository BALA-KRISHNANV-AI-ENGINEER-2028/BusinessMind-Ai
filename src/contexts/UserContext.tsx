import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { User, UserPreferences } from '../types/auth';
import { useAuth } from './AuthContext';
import { authApi } from '../services/auth.api';

interface UserContextValue {
  user: User | null;
  preferences: UserPreferences;
  updateProfile: (data: Partial<Omit<User, 'id' | 'preferences'>>) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
}

export const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useAuth();

  const updateProfile = async (data: Partial<Omit<User, 'id' | 'preferences'>>) => {
    if (!user) return;
    const updated = await authApi.updateProfile({
      fullName: data.fullName,
      jobTitle: data.jobTitle,
      phone: data.phone,
      bio: data.bio,
    });
    updateUser(updated);
  };

  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    if (!user) return;
    const updated = await authApi.updatePreferences(prefs);
    updateUser(updated);
  };

  const preferences = useMemo(
    () =>
      user?.preferences ?? {
        timezone: 'UTC',
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
