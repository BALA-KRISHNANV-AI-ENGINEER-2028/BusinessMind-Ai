/**
 * Pagination utilities.
 *
 * Helpers for parsing query string pagination params and building
 * the PaginationMeta object included in all list API responses.
 *
 * Mirrors the frontend ListQueryParams and PaginatedResponse types.
 */

import { PAGINATION } from '../constants/app.constants';
import type { PaginationOptions, PaginationMeta, ListQueryParams } from '../types/common.types';

// ─── Parse Query Params ────────────────────────────────────────────────────────

/**
 * Parses raw query string params into a validated PaginationOptions object.
 * Applies defaults and clamps values to safe ranges.
 *
 * @example
 * // GET /api/v1/users?page=2&pageSize=25&sortBy=createdAt&sortDirection=desc
 * const opts = parsePaginationQuery(req.query);
 * // → { page: 2, pageSize: 25, sortBy: 'createdAt', sortDirection: 'desc' }
 */
export function parsePaginationQuery(query: ListQueryParams): PaginationOptions {
  const page = Math.max(1, parseInt(String(query.page ?? PAGINATION.DEFAULT_PAGE), 10) || PAGINATION.DEFAULT_PAGE);

  const rawPageSize = parseInt(String(query.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE), 10);
  const pageSize = Math.min(
    Math.max(1, isNaN(rawPageSize) ? PAGINATION.DEFAULT_PAGE_SIZE : rawPageSize),
    PAGINATION.MAX_PAGE_SIZE,
  );

  const sortDirection = query.sortDirection === 'asc' || query.sortDirection === 'desc'
    ? query.sortDirection
    : 'desc';

  return {
    page,
    pageSize,
    ...(query.sortBy ? { sortBy: query.sortBy } : {}),
    sortDirection,
  };
}

// ─── Build Pagination Meta ─────────────────────────────────────────────────────

/**
 * Builds the PaginationMeta object from the query options and total count.
 *
 * @param options - Parsed pagination options (from parsePaginationQuery).
 * @param total   - Total number of documents in the collection.
 *
 * @example
 * const pagination = buildPaginationMeta(opts, 42);
 * // → { page: 1, pageSize: 10, total: 42, totalPages: 5 }
 */
export function buildPaginationMeta(options: PaginationOptions, total: number): PaginationMeta {
  return {
    page: options.page,
    pageSize: options.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / options.pageSize)),
  };
}

// ─── Mongoose Skip / Limit ─────────────────────────────────────────────────────

/**
 * Converts PaginationOptions to MongoDB skip + limit values.
 *
 * @example
 * const { skip, limit } = toMongoosePagination(opts);
 * await UserModel.find({}).skip(skip).limit(limit);
 */
export function toMongoosePagination(options: PaginationOptions): { skip: number; limit: number } {
  return {
    skip: (options.page - 1) * options.pageSize,
    limit: options.pageSize,
  };
}
