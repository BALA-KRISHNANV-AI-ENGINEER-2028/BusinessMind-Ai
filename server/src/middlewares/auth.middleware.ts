/**
 * Authentication middleware.
 *
 * Validates access JWT from:
 * 1. Authorization header (Bearer token)
 * 2. HTTP-only cookies (bm_access_token)
 *
 * On success: attaches the decoded payload to req.user.
 * On failure: throws typed errors (TokenMissingError, TokenExpiredError, etc.).
 */

import type { Request, Response, NextFunction } from 'express';
import { extractBearerToken, verifyAccessToken } from '../utils/jwt.util';
import { TokenMissingError } from '../errors/HttpErrors';
import { ACCESS_COOKIE_NAME } from '../config/cookie.config';

/**
 * Extracts access token from Authorization header or HTTP-only cookies.
 */
function extractToken(req: Request): string | undefined {
  const bearerToken = extractBearerToken(req.headers.authorization);
  if (bearerToken) return bearerToken;

  const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME] as string | undefined;
  return cookieToken || undefined;
}

/**
 * Strictly requires a valid JWT.
 * Attaches the decoded payload to req.user.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new TokenMissingError();
    }
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
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);
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
    next();
  }
}

export const requireAuth = authenticate;

export function ensureAuthenticated(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new TokenMissingError());
  }
  next();
}
