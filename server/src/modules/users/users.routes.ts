/**
 * Users Routes. All routes require authentication.
 * Mounted at /api/v1/users
 */

import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { updateProfileSchema, updatePreferencesSchema } from './users.validator';

export const usersRouter = Router();

usersRouter.use(authenticate); // All user routes require auth

usersRouter.get('/me',                usersController.getProfile);
usersRouter.put('/me',                validate(updateProfileSchema),     usersController.updateProfile);
usersRouter.put('/me/preferences',    validate(updatePreferencesSchema), usersController.updatePreferences);
usersRouter.delete('/me',             usersController.deleteAccount);
