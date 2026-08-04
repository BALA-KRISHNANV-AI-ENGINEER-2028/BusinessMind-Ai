/**
 * Users Module — Interface.
 */

import type { UserProfile, UpdateProfileDto, UpdatePreferencesDto } from './users.types';

export interface IUsersService {
  getProfile(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, data: UpdateProfileDto): Promise<UserProfile>;
  updatePreferences(userId: string, data: UpdatePreferencesDto): Promise<UserProfile>;
  deleteAccount(userId: string): Promise<void>;
}
