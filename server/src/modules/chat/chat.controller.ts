/** Chat Controller. */
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async.util';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../../utils/response.util';
import { chatService } from './chat.service';
import { parsePaginationQuery } from '../../utils/pagination.util';

export const chatController = {
  getThreads: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePaginationQuery(req.query as Record<string, string>);
    const result = await chatService.getThreads(req.user!.id, req.user!.organizationId, pagination);
    sendPaginated(res, result.data, result.pagination);
  }),
  getThreadMessages: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePaginationQuery(req.query as Record<string, string>);
    const result = await chatService.getThreadMessages(req.params['threadId']!, req.user!.id, pagination);
    sendPaginated(res, result.data, result.pagination);
  }),
  createThread: asyncHandler(async (req: Request, res: Response) => {
    const thread = await chatService.createThread(req.user!.id, req.user!.organizationId, req.body);
    sendCreated(res, thread, 'Thread created');
  }),
  sendMessage: asyncHandler(async (req: Request, res: Response) => {
    const message = await chatService.sendMessage(req.user!.id, req.user!.organizationId, req.body);
    sendCreated(res, message, 'Message sent');
  }),
  deleteThread: asyncHandler(async (req: Request, res: Response) => {
    await chatService.deleteThread(req.params['threadId']!, req.user!.id);
    sendNoContent(res);
  }),
};
