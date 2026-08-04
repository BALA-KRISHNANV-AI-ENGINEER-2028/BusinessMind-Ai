/**
 * Users Module — Types.
 * Domain types for user profile management.
 */

import type { ISODateString } from '../../types/common.types';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  jobTitle?: string;
  phone?: string;
  bio?: string;
  defaultOrganizationId: string;
  preferences: UserPreferences;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface UserPreferences {
  timezone: string;
  language: string;
  emailNotifications: boolean;
  marketingEmails: boolean;
}

export interface UpdateProfileDto {
  fullName?: string;
  jobTitle?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface UpdatePreferencesDto {
  timezone?: string;
  language?: string;
  emailNotifications?: boolean;
  marketingEmails?: boolean;
}
