/** Knowledge Base Controller. */
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async.util';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../../utils/response.util';
import { knowledgeBaseService } from './knowledge-base.service';
import { parsePaginationQuery } from '../../utils/pagination.util';

export const knowledgeBaseController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePaginationQuery(req.query as Record<string, string>);
    const result = await knowledgeBaseService.getAll(req.user!.organizationId, pagination);
    sendPaginated(res, result.data, result.pagination);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await knowledgeBaseService.getById(req.params['id']!, req.user!.organizationId);
    sendSuccess(res, item);
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await knowledgeBaseService.create({ ...req.body, organizationId: req.user!.organizationId });
    sendCreated(res, item, 'Knowledge item created');
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await knowledgeBaseService.update(req.params['id']!, req.body);
    sendSuccess(res, item, 'Knowledge item updated');
  }),
  delete: asyncHandler(async (req: Request, res: Response) => {
    await knowledgeBaseService.delete(req.params['id']!, req.user!.organizationId);
    sendNoContent(res);
  }),
};
