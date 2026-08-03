/**
 * Response utilities.
 *
 * Centralised helper functions for sending consistent API responses.
 * Every controller sends responses through these helpers — never directly
 * via res.json() — to guarantee the envelope format matches the frontend
 * contract (src/types/api.ts).
 *
 * Frontend expects:
 *   Success:   { success: true,  data: T,    message?: string }
 *   Paginated: { success: true,  data: T[],  pagination: {...} }
 *   Error:     { success: false, message: string, code?: string, ... }
 */

import type { Response } from 'express';
import { HttpStatus } from '../constants/http.constants';
import type { ApiResponse, PaginatedResponse, ApiErrorResponse, PaginationMeta } from '../types/common.types';

// ─── Success Response ─────────────────────────────────────────────────────────

/**
 * Send a standard success response.
 *
 * @example
 * sendSuccess(res, user, 'User fetched successfully');
 * sendSuccess(res, created, 'Created', HttpStatus.CREATED);
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = HttpStatus.OK,
): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
  return res.status(statusCode).json(body);
}

// ─── Created Response ─────────────────────────────────────────────────────────

/**
 * Convenience wrapper for 201 Created responses.
 */
export function sendCreated<T>(res: Response, data: T, message?: string): Response {
  return sendSuccess(res, data, message ?? 'Resource created successfully', HttpStatus.CREATED);
}

// ─── No Content Response ──────────────────────────────────────────────────────

/**
 * Send 204 No Content (e.g. after delete). Body is empty.
 */
export function sendNoContent(res: Response): Response {
  return res.status(HttpStatus.NO_CONTENT).send();
}

// ─── Paginated Response ───────────────────────────────────────────────────────

/**
 * Send a paginated list response.
 *
 * @example
 * sendPaginated(res, users, { page: 1, pageSize: 10, total: 42, totalPages: 5 });
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message?: string,
): Response {
  const body: PaginatedResponse<T> & { message?: string } = {
    success: true,
    data,
    pagination,
    ...(message ? { message } : {}),
  };
  return res.status(HttpStatus.OK).json(body);
}

// ─── Error Response ───────────────────────────────────────────────────────────

/**
 * Send a standard error response.
 * Prefer throwing AppError subclasses over calling this directly —
 * the global error middleware handles all AppErrors automatically.
 *
 * Use this only for custom error shapes that cannot use AppError.
 */
export function sendError(
  res: Response,
  message: string,
  statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  code?: string,
  details?: Record<string, string[]>,
  requestId?: string,
): Response {
  const body: ApiErrorResponse = {
    success: false,
    message,
    ...(code ? { code } : {}),
    statusCode,
    ...(details ? { details } : {}),
    ...(requestId ? { requestId } : {}),
  };
  return res.status(statusCode).json(body);
}
