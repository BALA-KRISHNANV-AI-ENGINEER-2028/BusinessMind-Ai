/**
 * Date utility helpers.
 *
 * Centralised date operations to avoid scattered date logic
 * and make testing easier (single place to mock).
 */

// ─── Current Time ─────────────────────────────────────────────────────────────

/** Returns the current UTC timestamp in milliseconds. */
export function nowMs(): number {
  return Date.now();
}

/** Returns the current UTC Date object. */
export function now(): Date {
  return new Date();
}

// ─── ISO Strings ──────────────────────────────────────────────────────────────

/**
 * Returns the current time as an ISO 8601 string.
 * @example '2024-01-15T10:30:00.000Z'
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Converts a Date (or ms timestamp) to an ISO 8601 string.
 */
export function toISO(date: Date | number): string {
  return new Date(date).toISOString();
}

// ─── Future Dates ─────────────────────────────────────────────────────────────

/**
 * Returns a Date that is `ms` milliseconds in the future from now.
 *
 * @example
 * const expiresAt = addMs(TOKEN_TTL.INVITE_LINK_MS); // 48h from now
 */
export function addMs(ms: number): Date {
  return new Date(Date.now() + ms);
}

/**
 * Returns the Unix timestamp (ms) for a date `ms` milliseconds in the future.
 */
export function futureMs(ms: number): number {
  return Date.now() + ms;
}

// ─── Expiry Checks ────────────────────────────────────────────────────────────

/** Returns true if the given date (or ms timestamp) is in the past. */
export function isExpired(dateOrMs: Date | number): boolean {
  const ms = dateOrMs instanceof Date ? dateOrMs.getTime() : dateOrMs;
  return Date.now() >= ms;
}

/** Returns true if the given date (or ms timestamp) is still in the future. */
export function isValid(dateOrMs: Date | number): boolean {
  return !isExpired(dateOrMs);
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Formats a date as YYYY-MM-DD.
 */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
