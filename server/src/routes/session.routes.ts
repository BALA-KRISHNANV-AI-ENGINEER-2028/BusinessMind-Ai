/**
 * Session Management Routes.
 * Mounted at /api/v1/sessions.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async.util';
import { sendSuccess, sendNoContent } from '../utils/response.util';
import { sessionRepository } from '../repositories/session.repository';

export const sessionRouter = Router();

sessionRouter.use(authenticate);

/** GET /api/v1/sessions — List active user sessions */
sessionRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const sessions = await sessionRepository.findUserSessions(req.user!.id);
    sendSuccess(res, sessions, 'Active sessions fetched successfully');
  }),
);

/** DELETE /api/v1/sessions/:sessionId — Revoke specific session */
sessionRouter.delete(
  '/:sessionId',
  asyncHandler(async (req: Request, res: Response) => {
    await sessionRepository.revokeSession(req.params['sessionId']!);
    sendNoContent(res);
  }),
);
