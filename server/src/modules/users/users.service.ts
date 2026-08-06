/**
 * Users Service.
 *
 * Implements User Profile, Preferences, Change Password, and Account management logic.
 */

import { userRepository } from '../../repositories/user.repository';
import { auditLogService } from '../../services/auditLog.service';
import { hashPassword, comparePassword } from '../../utils/password.util';
import { NotFoundError, UnauthorizedError } from '../../errors/HttpErrors';
import type { UserProfile, UpdateProfileDto, UpdatePreferencesDto } from './users.types';

export class UsersService {
  /**
   * Retrieves user profile by ID.
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found.');
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      jobTitle: user.jobTitle,
      phone: user.phone,
      bio: user.bio,
      defaultOrganizationId: user.defaultOrganizationId,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.createdAt,
    };
  }

  /**
   * Updates user profile attributes (fullName, jobTitle, phone, bio, avatarUrl).
   */
  async updateProfile(userId: string, data: UpdateProfileDto): Promise<UserProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found.');
    }

    const updated = await userRepository.update(userId, {
      fullName: data.fullName ? data.fullName.trim() : user.fullName,
      jobTitle: data.jobTitle !== undefined ? data.jobTitle.trim() : user.jobTitle,
      phone: data.phone !== undefined ? data.phone.trim() : user.phone,
      bio: data.bio !== undefined ? data.bio.trim() : user.bio,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl.trim() : user.avatarUrl,
    });

    if (!updated) {
      throw new NotFoundError('Failed to update user profile.');
    }

    await auditLogService.log({
      userId,
      action: 'user.update_profile',
      resource: 'User',
      resourceId: userId,
    });

    return {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Updates user preferences (timezone, language, emailNotifications, marketingEmails).
   */
  async updatePreferences(userId: string, data: UpdatePreferencesDto): Promise<UserProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found.');
    }

    const newPreferences = {
      ...user.preferences,
      ...data,
    };

    const updated = await userRepository.update(userId, {
      preferences: newPreferences,
    });

    if (!updated) {
      throw new NotFoundError('Failed to update user preferences.');
    }

    await auditLogService.log({
      userId,
      action: 'user.update_preferences',
      resource: 'User',
      resourceId: userId,
    });

    return {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Changes user password with current password verification.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const record = await userRepository.findById(userId);
    if (!record) {
      throw new NotFoundError('User not found.');
    }

    const userDoc = await userRepository.findByEmail(record.email);
    if (!userDoc || !userDoc.passwordHash) {
      throw new UnauthorizedError('Current password authentication failed.');
    }

    const match = await comparePassword(currentPassword, userDoc.passwordHash);
    if (!match) {
      throw new UnauthorizedError('Current password is incorrect.');
    }

    const newPasswordHash = await hashPassword(newPassword);
    await userRepository.update(userId, {
      passwordHash: newPasswordHash,
    });

    await auditLogService.log({
      userId,
      action: 'user.change_password',
      resource: 'User',
      resourceId: userId,
    });
  }

  /**
   * Soft-deletes user account.
   */
  async deleteAccount(userId: string): Promise<void> {
    await userRepository.delete(userId);
    await auditLogService.log({
      userId,
      action: 'user.delete_account',
      resource: 'User',
      resourceId: userId,
    });
  }
}

export const usersService = new UsersService();
