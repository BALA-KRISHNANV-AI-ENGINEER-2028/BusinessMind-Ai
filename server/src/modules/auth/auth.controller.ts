/**
 * Auth Controller — Placeholder.
 *
 * Phase 4: Route handlers wired to the service layer.
 * All methods return 501 Not Implemented — they will be completed in Phase 5
 * once the AuthService has real implementations.
 *
 * Each handler follows the same structure:
 * 1. Extract validated data from req (Zod middleware already ran).
 * 2. Delegate to authService.
 * 3. Send standardised response via sendSuccess/sendCreated.
 * 4. Errors propagate via asyncHandler → global error middleware.
 */

import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async.util';
import { sendSuccess, sendCreated } from '../../utils/response.util';
import { authService } from './auth.service';
import type { LoginDto, RegisterDto, RefreshTokenDto } from './auth.types';

export const authController = {
  /**
   * POST /api/v1/auth/register
   * Creates a new user account and returns a session.
   */
  register: asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as RegisterDto;
    const session = await authService.register(data);
    sendCreated(res, session, 'Account created successfully');
  }),

  /**
   * POST /api/v1/auth/login
   * Authenticates a user and returns a JWT session.
   */
  login: asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as LoginDto;
    const session = await authService.login(data);
    sendSuccess(res, session, 'Login successful');
  }),

  /**
   * POST /api/v1/auth/refresh
   * Issues a new access token from a valid refresh token.
   */
  refresh: asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as RefreshTokenDto;
    const tokens = await authService.refresh(data);
    sendSuccess(res, tokens, 'Token refreshed successfully');
  }),

  /**
   * POST /api/v1/auth/logout
   * Revokes the refresh token.
   */
  logout: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as { refreshToken: string };
    await authService.logout(refreshToken);
    sendSuccess(res, null, 'Logged out successfully');
  }),

  /**
   * POST /api/v1/auth/forgot-password
   * Sends a password reset email.
   */
  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };
    await authService.forgotPassword(email);
    // Always respond with 200 to avoid email enumeration
    sendSuccess(res, null, 'If an account with that email exists, a reset link has been sent.');
  }),

  /**
   * POST /api/v1/auth/reset-password
   * Resets the user password using a valid reset token.
   */
  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body as { token: string; newPassword: string };
    await authService.resetPassword(token, newPassword);
    sendSuccess(res, null, 'Password reset successfully. Please log in with your new password.');
  }),

  /**
   * GET /api/v1/auth/me
   * Returns the currently authenticated user.
   */
  me: asyncHandler(async (req: Request, res: Response) => {
    // req.user is populated by authenticate middleware
    sendSuccess(res, req.user, 'Current user fetched successfully');
  }),
};
