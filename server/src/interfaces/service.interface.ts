/**
 * Service layer interfaces.
 *
 * Defines the contract that service implementations must satisfy.
 * Controllers depend on IService, not on concrete service classes —
 * enabling easy mocking in tests and swapping implementations.
 *
 * Phase 4: Interface definitions only.
 * Phase 5+: Concrete implementations per module.
 */

import type { PaginationOptions, PaginationMeta } from '../types/common.types';

// ─── Generic CRUD Service Interface ──────────────────────────────────────────

/**
 * Base service interface mirroring standard CRUD use cases.
 *
 * @template T  - Domain entity.
 * @template C  - Create DTO.
 * @template U  - Update DTO.
 */
export interface IService<T, C, U> {
  getById(id: string): Promise<T>;
  getAll(filters: Partial<T>, pagination: PaginationOptions): Promise<{ data: T[]; pagination: PaginationMeta }>;
  create(data: C): Promise<T>;
  update(id: string, data: Partial<U>): Promise<T>;
  delete(id: string): Promise<void>;
}

// ─── Auth Service Interface ───────────────────────────────────────────────────

import type { AuthSessionResponse, LoginDto, RegisterDto, RefreshTokenDto } from '../types/auth.types';

export interface IAuthService {
  /** Registers a new user and returns a session. */
  register(data: RegisterDto): Promise<AuthSessionResponse>;

  /** Authenticates a user by email/password and returns a session. */
  login(data: LoginDto): Promise<AuthSessionResponse>;

  /** Issues a new access token from a valid refresh token. */
  refresh(data: RefreshTokenDto): Promise<Pick<AuthSessionResponse, 'token' | 'refreshToken' | 'expiresAt'>>;

  /** Revokes the refresh token (logout). */
  logout(refreshToken: string): Promise<void>;

  /** Initiates the forgot password flow. */
  forgotPassword(email: string): Promise<void>;

  /** Resets password using a valid reset token. */
  resetPassword(token: string, newPassword: string): Promise<void>;
}
