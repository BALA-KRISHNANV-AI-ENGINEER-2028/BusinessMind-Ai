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
import type { LoginDto, RegisterDto, RefreshTokenDto, GoogleOAuthDto } from './auth.types';

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
   * POST /api/v1/auth/google
   */
  google: asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as GoogleOAuthDto;
    const session = await authService.googleOAuth(data, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (session.refreshToken) {
      res.cookie(REFRESH_COOKIE_NAME, session.refreshToken, getRefreshTokenCookieOptions());
    }

    sendSuccess(res, session, 'Google authentication successful');
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
