/** Recommendations Controller. */
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async.util';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import { recommendationsService } from './recommendations.service';
import { parsePaginationQuery } from '../../utils/pagination.util';

export const recommendationsController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePaginationQuery(req.query as Record<string, string>);
    const result = await recommendationsService.getAll(req.user!.organizationId, pagination);
    sendPaginated(res, result.data, result.pagination);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const rec = await recommendationsService.getById(req.params['id']!, req.user!.organizationId);
    sendSuccess(res, rec);
  }),
  dismiss: asyncHandler(async (req: Request, res: Response) => {
    const rec = await recommendationsService.dismiss(req.params['id']!, req.user!.organizationId, req.body?.reason);
    sendSuccess(res, rec, 'Recommendation dismissed');
  }),
};
