/**
 * Users Controller.
 *
 * Route handlers for user profile, preferences, password change, and account management.
 */

import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async.util';
import { sendSuccess, sendNoContent } from '../../utils/response.util';
import { usersService } from './users.service';
import type { UpdateProfileDto, UpdatePreferencesDto } from './users.types';

export const usersController = {
  /** GET /api/v1/users/profile */
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const profile = await usersService.getProfile(req.user!.id);
    sendSuccess(res, profile, 'Profile fetched successfully');
  }),

  /** PATCH /api/v1/users/profile */
  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const profile = await usersService.updateProfile(req.user!.id, req.body as UpdateProfileDto);
    sendSuccess(res, profile, 'Profile updated successfully');
  }),

  /** PATCH /api/v1/users/preferences */
  updatePreferences: asyncHandler(async (req: Request, res: Response) => {
    const profile = await usersService.updatePreferences(req.user!.id, req.body as UpdatePreferencesDto);
    sendSuccess(res, profile, 'Preferences updated successfully');
  }),

  /** POST /api/v1/users/change-password */
  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    await usersService.changePassword(req.user!.id, currentPassword, newPassword);
    sendSuccess(res, null, 'Password changed successfully');
  }),

  /** DELETE /api/v1/users/me */
  deleteAccount: asyncHandler(async (req: Request, res: Response) => {
    await usersService.deleteAccount(req.user!.id);
    sendNoContent(res);
  }),
};
