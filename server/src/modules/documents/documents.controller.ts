/**
 * Documents Controller.
 */

import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async.util';
import { sendSuccess, sendPaginated, sendNoContent } from '../../utils/response.util';
import { documentsService } from './documents.service';
import { parsePaginationQuery, buildPaginationMeta } from '../../utils/pagination.util';

export const documentsController = {
  /** GET /api/v1/documents */
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePaginationQuery(req.query as Record<string, string>);
    const result = await documentsService.getAll(req.user!.organizationId, pagination);
    sendPaginated(res, result.data, result.pagination);
  }),

  /** GET /api/v1/documents/:id */
  getById: asyncHandler(async (req: Request, res: Response) => {
    const doc = await documentsService.getById(req.params['id']!, req.user!.organizationId);
    sendSuccess(res, doc);
  }),

  /** PUT /api/v1/documents/:id */
  update: asyncHandler(async (req: Request, res: Response) => {
    const doc = await documentsService.update(req.params['id']!, req.body);
    sendSuccess(res, doc, 'Document updated');
  }),

  /** DELETE /api/v1/documents/:id */
  delete: asyncHandler(async (req: Request, res: Response) => {
    await documentsService.delete(req.params['id']!, req.user!.organizationId);
    sendNoContent(res);
  }),
};
