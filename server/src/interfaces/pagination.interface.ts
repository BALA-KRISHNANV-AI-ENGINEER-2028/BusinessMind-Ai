/**
 * Pagination interfaces.
 *
 * Types used across the repository and service layers for
 * paginated query operations.
 */

// ─── Options ──────────────────────────────────────────────────────────────────

export interface IPaginationOptions {
  /** Current page number (1-indexed). */
  page: number;
  /** Number of items per page. */
  pageSize: number;
  /** Field to sort by (e.g. 'createdAt', 'name'). */
  sortBy?: string;
  /** Sort direction. */
  sortDirection?: 'asc' | 'desc';
}

// ─── Result ───────────────────────────────────────────────────────────────────

export interface IPaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface IPaginatedResult<T> {
  data: T[];
  pagination: IPaginationMeta;
}
