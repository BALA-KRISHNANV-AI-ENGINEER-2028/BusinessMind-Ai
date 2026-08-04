/** Settings Routes. Mounted at /api/v1/settings */
import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { updateOrgSettingsSchema } from './settings.validator';
import { PERMISSIONS } from '../../constants/app.constants';

export const settingsRouter = Router();
settingsRouter.use(authenticate);

settingsRouter.get('/org', settingsController.getOrgSettings);
settingsRouter.put('/org', requirePermission(PERMISSIONS.ORG_SETTINGS_EDIT), validate(updateOrgSettingsSchema), settingsController.updateOrgSettings);
settingsRouter.get('/security', settingsController.getSecuritySettings);
