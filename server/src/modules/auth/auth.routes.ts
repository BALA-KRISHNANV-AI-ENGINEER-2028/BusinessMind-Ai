/**
 * Auth Routes.
 * Mounted under /api/v1/auth.
 */

import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middlewares/validation.middleware';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware';
import { authLimiter } from '../../middlewares/rateLimiter.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  googleOAuthSchema,
} from './auth.validator';

export const authRouter = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
authRouter.post('/register', authLimiter, validate(registerSchema), authController.register);
authRouter.post('/login', authLimiter, validate(loginSchema), authController.login);
authRouter.post('/google', authLimiter, validate(googleOAuthSchema), authController.google);
authRouter.post('/refresh', validate(refreshTokenSchema), authController.refresh);

// ── Protected / Session routes ────────────────────────────────────────────────
authRouter.get('/me', authenticate, authController.me);
authRouter.post('/logout', optionalAuthenticate, authController.logout);
