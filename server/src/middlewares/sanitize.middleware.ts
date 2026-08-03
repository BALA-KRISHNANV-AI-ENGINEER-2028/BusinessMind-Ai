/**
 * Input Sanitisation Middleware — Preparation.
 *
 * Phase 4: Scaffold only. Provides the middleware hooks where sanitisation
 * will be integrated in a later phase. Currently performs basic trimming
 * and type coercion as a minimal first layer of defence.
 *
 * Future integration points (Phase 6+):
 * - DOMPurify / sanitize-html for HTML stripping
 * - mongo-sanitize for MongoDB operator injection prevention
 * - xss package for XSS payload removal
 *
 * @note Zod schemas (validation.middleware.ts) already strip unknown fields
 *       via .strip() (the default). This middleware adds a supplementary layer.
 */

import type { Request, Response, NextFunction } from 'express';
import { trimObjectStrings } from '../utils/string.util';

/**
 * Sanitises the request body by:
 * 1. Trimming whitespace from all top-level string values.
 * 2. Removing keys with null/undefined values (preparation for future deep clean).
 *
 * Apply before Zod validation for cleanest data.
 */
export function sanitizeBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    req.body = trimObjectStrings(req.body as Record<string, unknown>);
  }
  next();
}

/**
 * Sanitises query string parameters by trimming string values.
 */
export function sanitizeQuery(req: Request, _res: Response, next: NextFunction): void {
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      const value = req.query[key];
      if (typeof value === 'string') {
        req.query[key] = value.trim();
      }
    }
  }
  next();
}

/**
 * Combined sanitisation — applies sanitizeBody and sanitizeQuery together.
 * Apply globally in app.ts after body parsing.
 */
export function sanitizeRequest(req: Request, res: Response, next: NextFunction): void {
  sanitizeBody(req, res, () => sanitizeQuery(req, res, next));
}
