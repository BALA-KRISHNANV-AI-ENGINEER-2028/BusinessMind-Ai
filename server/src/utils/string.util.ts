/**
 * String utilities.
 *
 * Pure functions for string manipulation used across services and models.
 * No side effects, no imports from app code — safe to import anywhere.
 */

// ─── Slug ─────────────────────────────────────────────────────────────────────

/**
 * Converts a string to a URL-safe slug.
 *
 * @example
 * slugify('Acme Corp Ltd.')  // → 'acme-corp-ltd'
 * slugify('Hello World 123') // → 'hello-world-123'
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')   // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_]+/g, '-')    // Replace whitespace and underscores with hyphens
    .replace(/-+/g, '-')        // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '');   // Strip leading/trailing hyphens
}

// ─── Capitalise ───────────────────────────────────────────────────────────────

/**
 * Capitalises the first letter of a string.
 *
 * @example
 * capitalize('hello world') // → 'Hello world'
 */
export function capitalize(input: string): string {
  if (!input) return '';
  return input.charAt(0).toUpperCase() + input.slice(1);
}

/**
 * Title-cases every word in a string.
 *
 * @example
 * titleCase('hello world') // → 'Hello World'
 */
export function titleCase(input: string): string {
  return input
    .split(' ')
    .map((word) => capitalize(word.toLowerCase()))
    .join(' ');
}

// ─── Truncation ───────────────────────────────────────────────────────────────

/**
 * Truncates a string to `maxLength` characters, appending an ellipsis if needed.
 *
 * @example
 * truncate('Hello World', 8) // → 'Hello...'
 */
export function truncate(input: string, maxLength: number, ellipsis = '...'): string {
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength - ellipsis.length) + ellipsis;
}

// ─── Sanitisation ─────────────────────────────────────────────────────────────

/**
 * Strips leading/trailing whitespace from all string values in an object.
 * Useful for sanitising request bodies before processing.
 *
 * @example
 * trimObjectStrings({ email: '  user@example.com  ', name: 'Alice ' })
 * // → { email: 'user@example.com', name: 'Alice' }
 */
export function trimObjectStrings<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj } as Record<string, unknown>;
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string') {
      result[key] = (result[key] as string).trim();
    }
  }
  return result as T;
}

/**
 * Normalises an email address: trims whitespace and lowercases.
 */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ─── Masking ──────────────────────────────────────────────────────────────────

/**
 * Masks all but the last `visibleChars` characters of a sensitive string.
 * Useful for logging token fragments without exposing full values.
 *
 * @example
 * maskSecret('mysecrettoken', 4) // → '*********oken'
 */
export function maskSecret(value: string, visibleChars = 4): string {
  if (value.length <= visibleChars) return '*'.repeat(value.length);
  return '*'.repeat(value.length - visibleChars) + value.slice(-visibleChars);
}

// ─── Validation Helpers ───────────────────────────────────────────────────────

/** Returns true if the string is a non-empty, non-whitespace-only string. */
export function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
