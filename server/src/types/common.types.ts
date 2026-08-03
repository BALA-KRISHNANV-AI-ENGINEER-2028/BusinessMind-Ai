/**
 * Common shared utility types.
 *
 * These types mirror the API contract shapes defined in the frontend
 * (src/types/api.ts) so that the backend response envelopes match
 * exactly what the frontend expects.
 *
 * Rule: never import from modules here — only primitives and utility types.
 */

// ─── API Response Envelopes ───────────────────────────────────────────────────
// These MUST stay in sync with frontend src/types/api.ts

/**
 * Standard success response envelope.
 * Frontend expects: { success: true, data: T, message?: string }
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard error response envelope.
 * Frontend expects: { success: false, message: string, code?: string, ... }
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  /** Machine-readable error code (e.g. 'UNAUTHORIZED', 'NOT_FOUND'). */
  code?: string;
  statusCode?: number;
  /** Field-level validation errors from Zod. */
  details?: Record<string, string[]>;
  /** Request ID for tracing. */
  requestId?: string;
}

/**
 * Standard paginated list response envelope.
 * Frontend expects: { success: true, data: T[], pagination: {...} }
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: SortDirection;
}

export type SortDirection = 'asc' | 'desc';

// ─── Common Query Params ──────────────────────────────────────────────────────

export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: SortDirection;
}

// ─── Utility Types ────────────────────────────────────────────────────────────

/** Makes specific keys of T required, all others optional. */
export type RequireFields<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

/** Makes specific keys of T optional, all others required. */
export type PartialFields<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

/** Removes undefined from all values of T. */
export type Defined<T> = { [K in keyof T]-?: NonNullable<T[K]> };

/** Extract keys of T whose values extend V. */
export type KeysOfType<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];

/** MongoDB document ID (stored as string in API responses). */
export type DocumentId = string;

/** ISO 8601 date string (e.g. "2024-01-15T10:30:00.000Z"). */
export type ISODateString = string;

/** A record with at least one key. */
export type NonEmptyRecord<K extends string, V> = Record<K, V> & { [key: string]: V };

// ─── Service Result Pattern ───────────────────────────────────────────────────

/**
 * Discriminated union for service layer results.
 * Avoids throwing for expected business rule failures (e.g. "user not found").
 *
 * @example
 * const result = await userService.findById(id);
 * if (!result.ok) return next(new NotFoundError(result.error));
 * const user = result.value;
 */
export type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; code?: string };

export function ok<T>(value: T): ServiceResult<T> {
  return { ok: true, value };
}

export function fail<T>(error: string, code?: string): ServiceResult<T> {
  return { ok: false, error, code };
}
