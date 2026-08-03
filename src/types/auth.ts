import type { OrgMemberRole } from './organization';

/**
 * User preferences (timezone, language, theme).
 */
export interface UserPreferences {
  timezone: string;
  language: string;
  emailNotifications: boolean;
  marketingEmails: boolean;
}

/**
 * User entity representation.
 */
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  jobTitle?: string;
  phone?: string;
  bio?: string;
  defaultOrganizationId: string;
  preferences: UserPreferences;
  createdAt: string;
}

export interface UserOrganizationMembership {
  organizationId: string;
  organizationName: string;
  role: OrgMemberRole;
}

export interface AuthSession {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp ms
  memberships: UserOrganizationMembership[];
}

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
