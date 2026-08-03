/**
 * Generic API response type wrappers.
 *
 * Every service function returns one of these shapes, ensuring callers
 * always handle both the data and error cases. These frontend contracts
 * will match the actual backend response envelopes once the API is live
 * in Phase 4 — only the service function bodies will change, not callers.
 */

// ─── Response Envelopes ───────────────────────────────────────────────────────

/** Standard success envelope. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: true;
}

/** Standard paginated list response envelope. */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  success: true;
}

/** Standard API error shape — mirrors backend HTTP error responses. */
export interface ApiError {
  success: false;
  message: string;
  /** Machine-readable error code (e.g. 'UNAUTHORIZED', 'NOT_FOUND'). */
  code?: string;
  statusCode?: number;
  /** Field-level validation errors from the backend. */
  details?: Record<string, string[]>;
}

/**
 * Discriminated union result type for service functions.
 *
 * @example
 * const result = await authService.getCurrentUser();
 * if (!result.success) { console.error(result.message); return; }
 * const user = result.data;
 */
export type ApiResult<T> = ApiResponse<T> | ApiError;

// ─── Query Params ─────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc';

/** Common query parameters shared by all paginated list endpoints. */
export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: SortDirection;
}
