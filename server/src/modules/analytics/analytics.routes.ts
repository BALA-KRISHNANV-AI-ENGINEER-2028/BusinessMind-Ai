import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { PERMISSIONS } from '../../constants/app.constants';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate);

analyticsRouter.get('/dashboard', requirePermission(PERMISSIONS.ANALYTICS_READ), analyticsController.getDashboardMetrics);
analyticsRouter.get('/metrics', requirePermission(PERMISSIONS.ANALYTICS_READ), analyticsController.getMetrics);
analyticsRouter.get('/decision-volume', requirePermission(PERMISSIONS.ANALYTICS_READ), analyticsController.getDecisionVolume);
analyticsRouter.get('/table-rows', requirePermission(PERMISSIONS.ANALYTICS_READ), analyticsController.getTableRows);
