/**
 * Password hashing utilities using bcrypt.
 *
 * All password operations are centralised here so that:
 * 1. The salt round constant is managed in one place (app.constants.ts).
 * 2. The auth service never imports bcrypt directly.
 * 3. Switching to Argon2 in future requires only changes here.
 */

import bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../constants/app.constants';

/**
 * Hashes a plain-text password using bcrypt.
 *
 * @param plaintext - The raw password from the registration/change-password form.
 * @returns         - The bcrypt hash to store in the database.
 *
 * @example
 * const hash = await hashPassword('MySecurePassword123!');
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares a plain-text password against a bcrypt hash.
 *
 * @param plaintext - The password submitted at login.
 * @param hash      - The stored bcrypt hash from the database.
 * @returns         - true if the passwords match, false otherwise.
 *
 * @example
 * const isValid = await comparePassword(req.body.password, user.passwordHash);
 * if (!isValid) throw new InvalidCredentialsError();
 */
export async function comparePassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

/**
 * Validates password strength.
 *
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * @returns An array of unmet requirement messages (empty if valid).
 */
export function validatePasswordStrength(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }

  return errors;
}
