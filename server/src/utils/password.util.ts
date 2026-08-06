/**
 * Password Hashing Utilities.
 *
 * Encapsulates bcrypt password hashing and verification.
 * Enforces 12 salt rounds (BCRYPT_SALT_ROUNDS).
 */

import bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../constants/app.constants';

/**
 * Hashes a plain-text password using bcrypt.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares a plain-text password against a stored bcrypt hash.
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
