/**
 * Auth Controller.
 *
 * Receives authenticated request payloads, invokes AuthService business logic,
 * sets HTTP-only cookies for refresh tokens, and formats API responses.
 */

import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async.util';
import { sendSuccess, sendCreated } from '../../utils/response.util';
import { authService } from './auth.service';
import {
  REFRESH_COOKIE_NAME,
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
} from '../../config/cookie.config';
import { config } from '../../config';
import type { LoginDto, RegisterDto, RefreshTokenDto } from './auth.types';

export const authController = {
  /**
   * POST /api/v1/auth/register
   */
  register: asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as RegisterDto;
    const session = await authService.register(data, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (session.refreshToken) {
      res.cookie(REFRESH_COOKIE_NAME, session.refreshToken, getRefreshTokenCookieOptions());
    }

    sendCreated(res, session, 'Account created successfully');
  }),

  /**
   * POST /api/v1/auth/login
   */
  login: asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as LoginDto;
    const session = await authService.login(data, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (session.refreshToken) {
      res.cookie(REFRESH_COOKIE_NAME, session.refreshToken, getRefreshTokenCookieOptions());
    }

    sendSuccess(res, session, 'Login successful');
  }),

  /**
   * GET /api/v1/auth/google/initiate
   * Redirects the browser to Google's OAuth authorization page.
   */
  initiateGoogle: asyncHandler(async (_req: Request, res: Response) => {
    const authUrl = authService.googleInitiateOAuth();
    res.redirect(authUrl);
  }),

  /**
   * GET /api/v1/auth/google/callback
   * Google redirects here after the user authorizes (or denies) access.
   * Exchanges the code, issues JWTs, sets refresh cookie, redirects to frontend.
   */
  googleCallback: asyncHandler(async (req: Request, res: Response) => {
    const code = req.query['code'] as string | undefined;
    const error = req.query['error'] as string | undefined;

    const frontendUrl = config.google.frontendUrl || 'http://localhost:5173';
    const callbackPath = '/auth/callback';

    // User denied access or Google returned an error
    if (error || !code) {
      const message = error === 'access_denied'
        ? 'Google sign-in was cancelled.'
        : (error ?? 'Google authentication failed.');
      const redirectUrl = `${frontendUrl}${callbackPath}?error=${encodeURIComponent(message)}`;
      res.redirect(redirectUrl);
      return;
    }

    try {
      const session = await authService.googleCallback(code, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Set HTTP-only refresh token cookie
      if (session.refreshToken) {
        res.cookie(REFRESH_COOKIE_NAME, session.refreshToken, getRefreshTokenCookieOptions());
      }

      // Pass access token to frontend via URL params
      // The OAuthCallbackPage immediately reads these and navigates away,
      // minimizing the time the token is visible in browser history.
      const params = new URLSearchParams({
        token: session.token,
        expiresAt: String(session.expiresAt),
      });

      res.redirect(`${frontendUrl}${callbackPath}?${params.toString()}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google authentication failed.';
      const redirectUrl = `${frontendUrl}${callbackPath}?error=${encodeURIComponent(message)}`;
      res.redirect(redirectUrl);
    }
  }),

  /**
   * POST /api/v1/auth/refresh
   */
  refresh: asyncHandler(async (req: Request, res: Response) => {
    const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    const bodyToken = (req.body as RefreshTokenDto)?.refreshToken;
    const refreshToken = cookieToken || bodyToken || '';

    const tokens = await authService.refresh(
      { refreshToken },
      { ip: req.ip, userAgent: req.headers['user-agent'] },
    );

    if (tokens.refreshToken) {
      res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, getRefreshTokenCookieOptions());
    }

    sendSuccess(res, tokens, 'Token refreshed successfully');
  }),

  /**
   * POST /api/v1/auth/logout
   */
  logout: asyncHandler(async (req: Request, res: Response) => {
    const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    const bodyToken = (req.body as { refreshToken?: string })?.refreshToken;
    const refreshToken = cookieToken || bodyToken || '';

    await authService.logout(refreshToken, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions());
    sendSuccess(res, null, 'Logged out successfully');
  }),

  /**
   * GET /api/v1/auth/me
   */
  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      sendSuccess(res, null, 'Not authenticated');
      return;
    }
    const session = await authService.getMe(req.user.id, req.user.organizationId);
    sendSuccess(res, session, 'Current user session fetched successfully');
  }),
};
