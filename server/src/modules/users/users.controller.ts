/**
 * Users Controller — Placeholder.
 */

import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async.util';
import { sendSuccess, sendNoContent } from '../../utils/response.util';
import { usersService } from './users.service';
import type { UpdateProfileDto, UpdatePreferencesDto } from './users.types';

export const usersController = {
  /** GET /api/v1/users/me */
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const profile = await usersService.getProfile(req.user!.id);
    sendSuccess(res, profile, 'Profile fetched successfully');
  }),

  /** PUT /api/v1/users/me */
  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const profile = await usersService.updateProfile(req.user!.id, req.body as UpdateProfileDto);
    sendSuccess(res, profile, 'Profile updated successfully');
  }),

  /** PUT /api/v1/users/me/preferences */
  updatePreferences: asyncHandler(async (req: Request, res: Response) => {
    const profile = await usersService.updatePreferences(req.user!.id, req.body as UpdatePreferencesDto);
    sendSuccess(res, profile, 'Preferences updated successfully');
  }),

  /** DELETE /api/v1/users/me */
  deleteAccount: asyncHandler(async (req: Request, res: Response) => {
    await usersService.deleteAccount(req.user!.id);
    sendNoContent(res);
  }),
};
