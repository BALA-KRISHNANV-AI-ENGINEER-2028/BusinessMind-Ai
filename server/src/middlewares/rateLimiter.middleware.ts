/**
 * Rate Limiter Middleware — Preparation.
 *
 * Provides pre-configured rate limiter instances for different tiers.
 * The actual limits are driven by the RATE_LIMIT constants in api.constants.ts.
 *
 * Usage (in routes):
 *   import { globalLimiter, authLimiter } from '@middlewares/rateLimiter.middleware';
 *   router.post('/login', authLimiter, asyncHandler(authController.login));
 *
 * Phase 4: Infrastructure only. Limits are conservative.
 * Phase 6+: Integrate with Redis store for distributed rate limiting across instances.
 *
 * @see https://github.com/express-rate-limit/express-rate-limit
 */

import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '../constants/api.constants';
import { HttpStatus, ErrorCode } from '../constants/http.constants';
import type { Response } from 'express';

// ─── Response Builder ─────────────────────────────────────────────────────────

const rateLimitHandler = (_req: unknown, res: Response) => {
  res.status(HttpStatus.TOO_MANY_REQUESTS).json({
    success: false,
    message: 'Too many requests — please slow down and try again later.',
    code: ErrorCode.RATE_LIMIT_EXCEEDED,
    statusCode: HttpStatus.TOO_MANY_REQUESTS,
  });
};

// ─── Limiter Instances ────────────────────────────────────────────────────────

/**
 * Global rate limiter — applied to all routes in app.ts.
 * 100 requests per 15 minutes per IP.
 */
export const globalLimiter = rateLimit({
  windowMs: RATE_LIMIT.GLOBAL.windowMs,
  max: RATE_LIMIT.GLOBAL.max,
  standardHeaders: true,  // Set X-RateLimit-* response headers (RFC 6585)
  legacyHeaders: false,   // Disable X-RateLimit-* prefixed headers
  handler: rateLimitHandler,
  skipSuccessfulRequests: false,
});

/**
 * Auth limiter — stricter, for login, register, password-reset routes.
 * 20 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH.windowMs,
  max: RATE_LIMIT.AUTH.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: 'Too many authentication attempts. Please wait before trying again.',
  skipSuccessfulRequests: false,
});

/**
 * AI limiter — very strict, for expensive AI inference routes.
 * 10 requests per 1 minute per IP.
 */
export const aiLimiter = rateLimit({
  windowMs: RATE_LIMIT.AI.windowMs,
  max: RATE_LIMIT.AI.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Upload limiter — for file upload routes.
 * 50 uploads per hour per IP.
 */
export const uploadLimiter = rateLimit({
  windowMs: RATE_LIMIT.UPLOAD.windowMs,
  max: RATE_LIMIT.UPLOAD.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
