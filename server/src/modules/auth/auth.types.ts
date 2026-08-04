/**
 * Auth Module — Types.
 *
 * Module-specific type definitions for the authentication domain.
 * Re-exports shared auth types from the global types layer and extends them
 * with module-specific response shapes.
 */

export type {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  GoogleOAuthDto,
  GoogleUserProfile,
  AuthSessionResponse,
  TokenPair,
  JwtPayload,
  RefreshTokenPayload,
} from '../../types/auth.types';
