import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async.util';
import { sendSuccess } from '../../utils/response.util';
import { analyticsService } from './analytics.service';

export const analyticsController = {
  getDashboardMetrics: asyncHandler(async (req: Request, res: Response) => {
    const data = await analyticsService.getDashboardMetrics(req.user!.organizationId);
    sendSuccess(res, data);
  }),
  getMetrics: asyncHandler(async (req: Request, res: Response) => {
    const data = await analyticsService.getMetrics(req.user!.organizationId);
    sendSuccess(res, data);
  }),
  getDecisionVolume: asyncHandler(async (req: Request, res: Response) => {
    const data = await analyticsService.getDecisionVolume(req.user!.organizationId);
    sendSuccess(res, data);
  }),
  getTableRows: asyncHandler(async (req: Request, res: Response) => {
    const data = await analyticsService.getTableRows(req.user!.organizationId);
    sendSuccess(res, data);
  }),
};
