/**
 * JWT utilities.
 *
 * Centralised token signing and verification. The auth service and
 * auth middleware import exclusively from here — never from jsonwebtoken directly.
 *
 * Token strategy:
 * - Access token:  short-lived (15m), contains full user context for requests.
 * - Refresh token: long-lived (7d), contains minimal payload for token rotation.
 */

import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index';
import { TOKEN_TTL } from '../constants/app.constants';
import {
  TokenExpiredError,
  TokenInvalidError,
  TokenMissingError,
} from '../errors/HttpErrors';
import type { JwtPayload, RefreshTokenPayload } from '../types/auth.types';

// ─── Sign Access Token ────────────────────────────────────────────────────────

/**
 * Signs and returns an access JWT.
 *
 * @param payload - Full user context to encode.
 * @returns       - Signed JWT string and expiresAt (Unix ms).
 *
 * @example
 * const { token, expiresAt } = signAccessToken(jwtPayload);
 */
export function signAccessToken(payload: JwtPayload): { token: string; expiresAt: number } {
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
    issuer: 'businessmind-api',
    audience: 'businessmind-client',
  };
  const token = jwt.sign(payload, config.jwt.secret, options);

  return {
    token,
    expiresAt: Date.now() + TOKEN_TTL.ACCESS_TOKEN_MS,
  };
}

// ─── Sign Refresh Token ───────────────────────────────────────────────────────

/**
 * Signs and returns a refresh JWT.
 */
export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
    issuer: 'businessmind-api',
    audience: 'businessmind-client',
  };
  return jwt.sign(payload, config.jwt.refreshSecret, options);
}

// ─── Verify Access Token ──────────────────────────────────────────────────────

/**
 * Verifies an access JWT and returns the decoded payload.
 *
 * @throws {TokenMissingError}  - if token is empty/undefined.
 * @throws {TokenExpiredError}  - if the token has expired.
 * @throws {TokenInvalidError}  - if the signature is invalid or malformed.
 */
export function verifyAccessToken(token: string | undefined): JwtPayload {
  if (!token) throw new TokenMissingError();

  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: 'businessmind-api',
      audience: 'businessmind-client',
    }) as JwtPayload;

    return decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw new TokenExpiredError();
    throw new TokenInvalidError();
  }
}

// ─── Verify Refresh Token ─────────────────────────────────────────────────────

/**
 * Verifies a refresh JWT and returns the decoded payload.
 *
 * @throws {TokenExpiredError} - if the refresh token has expired.
 * @throws {TokenInvalidError} - if the signature is invalid.
 */
export function verifyRefreshToken(token: string | undefined): RefreshTokenPayload {
  if (!token) throw new TokenInvalidError();

  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret, {
      issuer: 'businessmind-api',
      audience: 'businessmind-client',
    }) as RefreshTokenPayload;

    return decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw new TokenExpiredError();
    throw new TokenInvalidError();
  }
}

// ─── Sign & Verify Onboarding Token ──────────────────────────────────────────

export function signOnboardingToken(payload: { email: string; googleId: string; fullName: string; avatarUrl?: string }): string {
  const options: SignOptions = {
    expiresIn: '30m',
    issuer: 'businessmind-api',
    audience: 'businessmind-onboarding',
  };
  return jwt.sign({ ...payload, isPendingOnboarding: true }, config.jwt.secret, options);
}

export function verifyOnboardingToken(token: string): { email: string; googleId: string; fullName: string; avatarUrl?: string; isPendingOnboarding: boolean } {
  if (!token) throw new TokenMissingError();
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: 'businessmind-api',
      audience: 'businessmind-onboarding',
    }) as { email: string; googleId: string; fullName: string; avatarUrl?: string; isPendingOnboarding: boolean };
    return decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw new TokenExpiredError();
    throw new TokenInvalidError();
  }
}

// ─── Extract Bearer Token ─────────────────────────────────────────────────────

/**
 * Extracts the token string from an Authorization header value.
 *
 * @param authorizationHeader - The raw value of req.headers.authorization.
 * @returns                   - The bare token string, or undefined if not present.
 *
 * @example
 * const token = extractBearerToken('Bearer eyJhbGci...');
 * // → 'eyJhbGci...'
 */
export function extractBearerToken(authorizationHeader: string | undefined): string | undefined {
  if (!authorizationHeader?.startsWith('Bearer ')) return undefined;
  const token = authorizationHeader.slice(7).trim();
  return token || undefined;
}
