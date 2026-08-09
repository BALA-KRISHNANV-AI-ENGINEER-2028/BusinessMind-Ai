/**
 * Auth Routes.
 * Mounted under /api/v1/auth.
 *
 * Public routes (no authentication required):
 *   POST /register          — Create new account
 *   POST /login             — Email + password login
 *   GET  /google/initiate   — Redirect browser to Google OAuth
 *   GET  /google/callback   — Google redirects here after authorization
 *   POST /refresh           — Rotate access + refresh tokens
 *
 * Protected routes:
 *   GET  /me                — Get current user session
 *   POST /logout            — Revoke refresh token & clear cookie
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
} from './auth.validator';

export const authRouter = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
authRouter.post('/register', authLimiter, validate(registerSchema), authController.register);
authRouter.post('/login', authLimiter, validate(loginSchema), authController.login);

// ── Google OAuth (Authorization Code Flow) ────────────────────────────────────
// Step 1: Frontend calls this → backend redirects browser to Google
authRouter.get('/google/initiate', authController.initiateGoogle);
// Step 2: Google redirects here with ?code= → backend exchanges code, redirects to frontend
authRouter.get('/google/callback', authController.googleCallback);

// ── Token management ──────────────────────────────────────────────────────────
authRouter.post('/refresh', validate(refreshTokenSchema), authController.refresh);

// ── Protected / Session routes ────────────────────────────────────────────────
authRouter.get('/me', authenticate, authController.me);
authRouter.post('/logout', optionalAuthenticate, authController.logout);
