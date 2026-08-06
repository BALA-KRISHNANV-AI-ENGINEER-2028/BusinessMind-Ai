/**
 * Cookie Configuration.
 *
 * Defines secure cookie options for Refresh Tokens and Access Tokens.
 */

import type { CookieOptions } from 'express';
import { config } from './index';
import { TOKEN_TTL } from '../constants/app.constants';

export const REFRESH_COOKIE_NAME = 'bm_refresh_token';
export const ACCESS_COOKIE_NAME = 'bm_access_token';

/**
 * Returns CookieOptions for the Refresh Token cookie.
 * HTTP-only, SameSite=Lax (or Strict), Secure in production.
 */
export function getRefreshTokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' : 'lax',
    maxAge: TOKEN_TTL.REFRESH_TOKEN_MS,
    path: '/api/v1/auth', // Restrict cookie to auth routes only
  };
}

/**
 * Returns CookieOptions for clearing a cookie.
 */
export function getClearCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' : 'lax',
    path: '/api/v1/auth',
  };
}
