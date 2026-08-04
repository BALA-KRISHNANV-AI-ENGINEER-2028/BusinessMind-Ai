/**
 * Auth Service — Placeholder.
 *
 * Phase 4: Scaffold only — stubs that throw NOT_IMPLEMENTED.
 * Phase 5: Full implementation using User model, JWT utils, bcrypt utils.
 *
 * Business logic for:
 * - register: validate, hash password, create user, create org membership, issue tokens
 * - login: find user, compare password, issue access + refresh tokens
 * - refresh: verify refresh token, rotate tokens
 * - logout: invalidate refresh token
 * - forgotPassword: generate reset token, send email
 * - resetPassword: validate token, hash new password, invalidate token
 */

import { HttpStatus } from '../../constants/http.constants';
import { AppError } from '../../errors/AppError';
import { logger } from '../../config/logger.config';
import type { IAuthService } from '../../interfaces/service.interface';
import type {
  AuthSessionResponse,
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
} from '../../types/auth.types';

const NOT_IMPLEMENTED = (method: string) =>
  new AppError(
    `AuthService.${method} is not implemented yet. This will be completed in Phase 5.`,
    HttpStatus.NOT_IMPLEMENTED,
    'NOT_IMPLEMENTED',
    true,
  );

export class AuthService implements IAuthService {
  async register(_data: RegisterDto): Promise<AuthSessionResponse> {
    logger.debug('AuthService.register called (Phase 5 stub)');
    throw NOT_IMPLEMENTED('register');
  }

  async login(_data: LoginDto): Promise<AuthSessionResponse> {
    logger.debug('AuthService.login called (Phase 5 stub)');
    throw NOT_IMPLEMENTED('login');
  }

  async refresh(
    _data: RefreshTokenDto,
  ): Promise<Pick<AuthSessionResponse, 'token' | 'refreshToken' | 'expiresAt'>> {
    logger.debug('AuthService.refresh called (Phase 5 stub)');
    throw NOT_IMPLEMENTED('refresh');
  }

  async logout(_refreshToken: string): Promise<void> {
    logger.debug('AuthService.logout called (Phase 5 stub)');
    throw NOT_IMPLEMENTED('logout');
  }

  async forgotPassword(_email: string): Promise<void> {
    logger.debug('AuthService.forgotPassword called (Phase 5 stub)');
    throw NOT_IMPLEMENTED('forgotPassword');
  }

  async resetPassword(_token: string, _newPassword: string): Promise<void> {
    logger.debug('AuthService.resetPassword called (Phase 5 stub)');
    throw NOT_IMPLEMENTED('resetPassword');
  }
}

export const authService = new AuthService();
