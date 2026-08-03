/**
 * AppError — Base custom error class.
 *
 * All custom errors in this application extend AppError.
 * The global error middleware (`error.middleware.ts`) catches these
 * and serialises them into the standard ApiErrorResponse envelope.
 *
 * Design decisions:
 * - `isOperational` = true  → expected, recoverable errors (bad input, not found).
 *   The app can continue running. Log at WARN level.
 * - `isOperational` = false → programming bugs, unexpected states.
 *   The app should restart. Log at ERROR level and alert.
 */

import { HttpStatus, ErrorCode } from '../constants/http.constants';
import type { HttpStatusCode, ErrorCodeType } from '../constants/http.constants';

export class AppError extends Error {
  /** HTTP response status code. */
  public readonly statusCode: HttpStatusCode;

  /** Machine-readable error code sent to the client. */
  public readonly code: ErrorCodeType | string;

  /**
   * true  → operational error (expected, client-facing, recoverable).
   * false → programmer error (unexpected, must log + alert).
   */
  public readonly isOperational: boolean;

  /** Field-level validation errors (populated by ValidationError subclass). */
  public readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    code: ErrorCodeType | string = ErrorCode.INTERNAL_ERROR,
    isOperational = true,
    details?: Record<string, string[]>,
  ) {
    super(message);

    // Restore prototype chain (needed when extending built-in Error in TS)
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Capture V8 stack trace, excluding this constructor frame
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serialises the error to a plain object suitable for JSON responses.
   */
  public toJSON(requestId?: string): object {
    return {
      success: false,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(this.details ? { details: this.details } : {}),
      ...(requestId ? { requestId } : {}),
    };
  }
}
