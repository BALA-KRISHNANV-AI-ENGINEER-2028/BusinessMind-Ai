/**
 * Auth Routes.
 *
 * All routes mounted under /api/v1/auth.
 * Public routes: register, login, refresh, forgot-password, reset-password.
 * Protected routes: me, logout (require valid JWT).
 */

import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middlewares/validation.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { authLimiter } from '../../middlewares/rateLimiter.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.validator';

export const authRouter = Router();

// ── Public routes (no auth required) ─────────────────────────────────────────
authRouter.post('/register',       authLimiter, validate(registerSchema),       authController.register);
authRouter.post('/login',          authLimiter, validate(loginSchema),           authController.login);
authRouter.post('/refresh',        validate(refreshTokenSchema),                  authController.refresh);
authRouter.post('/forgot-password',authLimiter, validate(forgotPasswordSchema),  authController.forgotPassword);
authRouter.post('/reset-password', authLimiter, validate(resetPasswordSchema),   authController.resetPassword);

// ── Protected routes (require valid JWT) ──────────────────────────────────────
authRouter.get('/me',              authenticate,                                  authController.me);
authRouter.post('/logout',         authenticate, validate(refreshTokenSchema),    authController.logout);
authRouter.post('/change-password',authenticate, validate(changePasswordSchema),  authController.logout); // Phase 5: wire to changePassword
