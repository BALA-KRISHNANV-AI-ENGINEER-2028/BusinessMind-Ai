/**
 * Auth Repository — Placeholder.
 *
 * Phase 4: Scaffold only — no User model exists yet.
 * Phase 5: Implement with the User Mongoose model.
 *
 * This repository handles all database interactions for authentication:
 * - Finding users by email / ID
 * - Creating new users
 * - Storing and invalidating refresh tokens
 * - Password reset token management
 */

import { logger } from '../../config/logger.config';

// ─── Placeholder Interface ────────────────────────────────────────────────────

export interface IAuthRepository {
  // Phase 5: findUserByEmail(email: string): Promise<UserDocument | null>
  // Phase 5: findUserById(id: string): Promise<UserDocument | null>
  // Phase 5: createUser(data: RegisterDto): Promise<UserDocument>
  // Phase 5: saveRefreshToken(userId: string, token: string): Promise<void>
  // Phase 5: invalidateRefreshToken(token: string): Promise<void>
  // Phase 5: findValidRefreshToken(token: string): Promise<RefreshTokenDocument | null>
  // Phase 5: savePasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>
  // Phase 5: findValidPasswordResetToken(token: string): Promise<PasswordResetDocument | null>
  // Phase 5: invalidatePasswordResetToken(token: string): Promise<void>
}

/**
 * AuthRepository stub.
 *
 * Replace with a concrete Mongoose implementation in Phase 5.
 */
export class AuthRepository implements IAuthRepository {
  constructor() {
    logger.debug('AuthRepository initialised (Phase 4 stub)');
  }
}

export const authRepository = new AuthRepository();
