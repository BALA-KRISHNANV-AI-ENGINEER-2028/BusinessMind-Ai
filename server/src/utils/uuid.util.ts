/**
 * UUID utility.
 *
 * Thin wrapper around the `uuid` package. Having a single import point
 * makes it trivial to switch UUID implementation (e.g. to nanoid) later.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a new v4 UUID string.
 *
 * @example
 * const id = generateId(); // '550e8400-e29b-41d4-a716-446655440000'
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Validates whether a string is a valid v4 UUID.
 */
export function isValidUUID(value: string): boolean {
  const UUID_V4_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return UUID_V4_REGEX.test(value);
}
