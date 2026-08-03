/**
 * Authentication middleware.
 *
 * Validates the Bearer JWT from the Authorization header.
 * On success: attaches the decoded payload to req.user.
 * On failure: throws a typed error (TokenMissingError, TokenExpiredError, etc.).
 *
 * Usage:
 *   router.get('/protected', authenticate, asyncHandler(controller.method));
 *
 * For optional auth (attach user if present, but don't reject):
 *   router.get('/optional', optionalAuthenticate, asyncHandler(controller.method));
 */

import type { Request, Response, NextFunction } from 'express';
import { extractBearerToken, verifyAccessToken } from '../utils/jwt.util';
import { TokenMissingError } from '../errors/HttpErrors';

/**
 * Strictly requires a valid Bearer JWT.
 * Attaches the decoded payload to req.user.
 * Throws TokenMissingError, TokenExpiredError, or TokenInvalidError on failure.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
      organizationId: payload.organizationId,
      role: payload.role,
      permissions: payload.permissions,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication — attaches user if token is present and valid,
 * but allows the request through even without a token.
 *
 * Useful for endpoints that behave differently for authenticated users.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (token) {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        fullName: payload.fullName,
        organizationId: payload.organizationId,
        role: payload.role,
        permissions: payload.permissions,
      };
    }
    next();
  } catch {
    // Silently ignore invalid tokens for optional auth routes
    next();
  }
}

/**
 * Requires the request to be authenticated (alias for `authenticate`).
 * Use this when you want a semantically named guard in route files.
 */
export const requireAuth = authenticate;

/**
 * Guards a route that requires the user to provide their token.
 * Throws TokenMissingError if req.user is not set (i.e. authenticate was not called).
 */
export function ensureAuthenticated(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new TokenMissingError());
  }
  next();
}
