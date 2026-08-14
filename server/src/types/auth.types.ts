/**
 * Authentication-related types.
 *
 * Defines JWT payload shape, token pair, and auth context used throughout
 * the authentication middleware and auth module.
 */

import type { Role, Permission } from '../constants/app.constants';
import type { ISODateString } from './common.types';

// ─── JWT Payload ──────────────────────────────────────────────────────────────

/**
 * Payload encoded into the access JWT.
 * Keep this minimal — only what is needed for every request.
 */
export interface JwtPayload {
  /** Subject — MongoDB User ObjectId as string. */
  sub: string;
  /** User email. */
  email: string;
  /** User full name. */
  fullName: string;
  /** Active organisation context (multi-tenancy). */
  organizationId: string;
  /** User role within the active organisation. */
  role: Role;
  /** Computed permission set at token-issue time. */
  permissions: Permission[];
  /** Issued-at (seconds since epoch, standard JWT claim). */
  iat?: number;
  /** Expiry (seconds since epoch, standard JWT claim). */
  exp?: number;
}

/**
 * Payload encoded into the refresh JWT.
 * Minimal — only what's needed to issue a new access token.
 */
export interface RefreshTokenPayload {
  sub: string;
  email: string;
  /** Token family ID for refresh token rotation (prevents reuse attacks). */
  family: string;
  iat?: number;
  exp?: number;
}

// ─── Token Pair ───────────────────────────────────────────────────────────────

/**
 * Access + refresh token pair returned by login/refresh endpoints.
 * Matches the frontend AuthSession.token / AuthSession.refreshToken fields.
 */
export interface TokenPair {
  token: string;
  refreshToken: string;
  /** Unix timestamp in ms when the access token expires. */
  expiresAt: number;
}

// ─── Auth Request DTOs ────────────────────────────────────────────────────────

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  jobTitle?: string;
  phone?: string;
  avatarUrl?: string;
  companyName: string;
  organizationName?: string; // Backwards compatibility fallback
  companyWebsite?: string;
  industry?: string;
  companySize?: string;
  companyDescription?: string;
  country?: string;
  timezone?: string;
}

export interface CompleteOnboardingDto {
  onboardingToken: string;
  fullName: string;
  jobTitle?: string;
  phone?: string;
  companyName: string;
  companyWebsite?: string;
  industry?: string;
  companySize?: string;
  companyDescription?: string;
  country?: string;
  timezone?: string;
}

export interface OnboardingTokenPayload {
  email: string;
  googleId: string;
  fullName: string;
  avatarUrl?: string;
  isPendingOnboarding: boolean;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

// ─── Google OAuth DTO (prepared for Phase 5) ──────────────────────────────────

export interface GoogleOAuthDto {
  code: string;
  redirectUri: string;
}

export interface GoogleUserProfile {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  emailVerified: boolean;
}

// ─── Auth Session Response ────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  jobTitle?: string;
  phone?: string;
  bio?: string;
  defaultOrganizationId: string;
  preferences: {
    timezone: string;
    language: string;
    currency: string;
    emailNotifications: boolean;
    marketingEmails: boolean;
  };
  createdAt: ISODateString;
}

/**
 * Shape returned by POST /api/v1/auth/login.
 * Matches frontend AuthSession type exactly.
 */
export interface AuthSessionResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: number;
  memberships: Array<{
    organizationId: string;
    organizationName: string;
    role: Role;
  }>;
}
