/** Chat Routes. Mounted at /api/v1/chat */
import { Router } from 'express';
import { chatController } from './chat.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { aiLimiter } from '../../middlewares/rateLimiter.middleware';
import { listChatThreadsQuerySchema, createThreadSchema, sendMessageSchema } from './chat.validator';
import { PERMISSIONS } from '../../constants/app.constants';

export const chatRouter = Router();
chatRouter.use(authenticate);

chatRouter.get('/threads', requirePermission(PERMISSIONS.AI_CHAT), validate(listChatThreadsQuerySchema), chatController.getThreads);
chatRouter.post('/threads', requirePermission(PERMISSIONS.AI_CHAT), validate(createThreadSchema), chatController.createThread);
chatRouter.get('/threads/:threadId/messages', requirePermission(PERMISSIONS.AI_CHAT), chatController.getThreadMessages);
chatRouter.post('/messages', aiLimiter, requirePermission(PERMISSIONS.AI_CHAT), validate(sendMessageSchema), chatController.sendMessage);
chatRouter.delete('/threads/:threadId', requirePermission(PERMISSIONS.AI_CHAT), chatController.deleteThread);
