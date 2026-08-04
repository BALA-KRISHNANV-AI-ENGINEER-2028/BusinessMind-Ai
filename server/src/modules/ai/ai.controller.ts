/** AI Controller. */
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async.util';
import { sendSuccess } from '../../utils/response.util';
import { aiService } from './ai.service';

export const aiController = {
  query: asyncHandler(async (req: Request, res: Response) => {
    const result = await aiService.query({ ...req.body, organizationId: req.user!.organizationId });
    sendSuccess(res, result);
  }),
  getAgentStatuses: asyncHandler(async (req: Request, res: Response) => {
    const statuses = await aiService.getAgentStatuses(req.user!.organizationId);
    sendSuccess(res, statuses);
  }),
};
