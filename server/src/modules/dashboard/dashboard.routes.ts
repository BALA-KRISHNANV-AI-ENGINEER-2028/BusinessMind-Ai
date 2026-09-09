import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middlewares/auth.middleware';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get('/metrics', dashboardController.getMetrics);
dashboardRouter.get('/agents', dashboardController.getAgents);
dashboardRouter.get('/decisions', dashboardController.getDecisions);
dashboardRouter.get('/recommendations', dashboardController.getRecommendations);
dashboardRouter.get('/documents', dashboardController.getDocuments);
