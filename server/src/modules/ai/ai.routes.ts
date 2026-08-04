/** AI Routes. Mounted at /api/v1/ai */
import { Router } from 'express';
import { aiController } from './ai.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { aiLimiter } from '../../middlewares/rateLimiter.middleware';
import { aiQuerySchema } from './ai.validator';
import { PERMISSIONS } from '../../constants/app.constants';

export const aiRouter = Router();
aiRouter.use(authenticate);

aiRouter.post('/query', aiLimiter, requirePermission(PERMISSIONS.AI_CHAT), validate(aiQuerySchema), aiController.query);
aiRouter.get('/agents/status', aiController.getAgentStatuses);
