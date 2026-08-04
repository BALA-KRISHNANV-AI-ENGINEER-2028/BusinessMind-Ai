/** Recommendations Routes. Mounted at /api/v1/recommendations */
import { Router } from 'express';
import { recommendationsController } from './recommendations.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { listRecommendationsQuerySchema, dismissRecommendationSchema } from './recommendations.validator';
import { PERMISSIONS } from '../../constants/app.constants';

export const recommendationsRouter = Router();
recommendationsRouter.use(authenticate);

recommendationsRouter.get('/', requirePermission(PERMISSIONS.RECOMMENDATIONS_READ), validate(listRecommendationsQuerySchema), recommendationsController.getAll);
recommendationsRouter.get('/:id', requirePermission(PERMISSIONS.RECOMMENDATIONS_READ), recommendationsController.getById);
recommendationsRouter.post('/:id/dismiss', requirePermission(PERMISSIONS.RECOMMENDATIONS_DISMISS), validate(dismissRecommendationSchema), recommendationsController.dismiss);
