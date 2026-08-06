/**
 * Users Routes.
 * All routes require authentication.
 * Mounted at /api/v1/users.
 */

import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { updateProfileSchema, updatePreferencesSchema } from './users.validator';
import { changePasswordSchema } from '../auth/auth.validator';

export const usersRouter = Router();

usersRouter.use(authenticate); // All user routes require auth

usersRouter.get('/profile',            usersController.getProfile);
usersRouter.get('/me',                 usersController.getProfile);
usersRouter.patch('/profile',          validate(updateProfileSchema),     usersController.updateProfile);
usersRouter.put('/me',                 validate(updateProfileSchema),     usersController.updateProfile);
usersRouter.patch('/preferences',      validate(updatePreferencesSchema), usersController.updatePreferences);
usersRouter.put('/me/preferences',     validate(updatePreferencesSchema), usersController.updatePreferences);
usersRouter.post('/change-password',   validate(changePasswordSchema),    usersController.changePassword);
usersRouter.delete('/me',              usersController.deleteAccount);
