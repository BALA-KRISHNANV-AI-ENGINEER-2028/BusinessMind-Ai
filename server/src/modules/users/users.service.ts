/**
 * Users Service — Placeholder.
 * Phase 5: Full implementation.
 */

import { AppError } from '../../errors/AppError';
import { HttpStatus } from '../../constants/http.constants';
import type { IUsersService } from './users.interface';
import type { UserProfile, UpdateProfileDto, UpdatePreferencesDto } from './users.types';

const stub = (m: string) =>
  new AppError(`UsersService.${m} not implemented yet (Phase 5).`, HttpStatus.NOT_IMPLEMENTED, 'NOT_IMPLEMENTED', true);

export class UsersService implements IUsersService {
  async getProfile(_userId: string): Promise<UserProfile> { throw stub('getProfile'); }
  async updateProfile(_userId: string, _data: UpdateProfileDto): Promise<UserProfile> { throw stub('updateProfile'); }
  async updatePreferences(_userId: string, _data: UpdatePreferencesDto): Promise<UserProfile> { throw stub('updatePreferences'); }
  async deleteAccount(_userId: string): Promise<void> { throw stub('deleteAccount'); }
}

export const usersService = new UsersService();
