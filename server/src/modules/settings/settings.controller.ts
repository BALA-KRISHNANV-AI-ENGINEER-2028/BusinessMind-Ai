/** Settings Controller. */
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async.util';
import { sendSuccess } from '../../utils/response.util';
import { settingsService } from './settings.service';

export const settingsController = {
  getOrgSettings: asyncHandler(async (req: Request, res: Response) => {
    const settings = await settingsService.getOrgSettings(req.user!.organizationId);
    sendSuccess(res, settings);
  }),
  updateOrgSettings: asyncHandler(async (req: Request, res: Response) => {
    const settings = await settingsService.updateOrgSettings(req.user!.organizationId, req.body);
    sendSuccess(res, settings, 'Organisation settings updated');
  }),
  getSecuritySettings: asyncHandler(async (req: Request, res: Response) => {
    const settings = await settingsService.getSecuritySettings(req.user!.id);
    sendSuccess(res, settings);
  }),
};
