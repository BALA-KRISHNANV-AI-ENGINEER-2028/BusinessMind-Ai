/** Analytics Routes. Mounted at /api/v1/analytics */
import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { analyticsQuerySchema } from './analytics.validator';
import { PERMISSIONS } from '../../constants/app.constants';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate);

analyticsRouter.get('/dashboard', requirePermission(PERMISSIONS.ANALYTICS_READ), validate(analyticsQuerySchema), analyticsController.getDashboardMetrics);
