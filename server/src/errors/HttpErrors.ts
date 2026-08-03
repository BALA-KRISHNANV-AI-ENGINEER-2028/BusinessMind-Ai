/**
 * HTTP Error classes.
 *
 * Concrete AppError subclasses for every standard HTTP error scenario.
 * Throw these in controllers and services — the global error middleware
 * converts them to the standard ApiErrorResponse format automatically.
 *
 * @example
 * throw new NotFoundError('User not found');
 * throw new ValidationError('Invalid input', { email: ['Must be a valid email'] });
 * throw new UnauthorizedError(); // message defaults to 'Authentication required'
 */

import { AppError } from './AppError';
import { HttpStatus, ErrorCode, HttpMessage } from '../constants/http.constants';
import type { ErrorCodeType } from '../constants/http.constants';

// ─── 400 Bad Request ──────────────────────────────────────────────────────────

export class BadRequestError extends AppError {
  constructor(
    message: string = HttpMessage.BAD_REQUEST,
    code: ErrorCodeType | string = ErrorCode.BAD_REQUEST,
    details?: Record<string, string[]>,
  ) {
    super(message, HttpStatus.BAD_REQUEST, code, true, details);
  }
}

// ─── 400 Validation Error ─────────────────────────────────────────────────────

/**
 * Used by the Zod validation middleware to surface field-level errors.
 * The `details` map contains field names → array of error messages.
 */
export class ValidationError extends AppError {
  constructor(
    message: string = HttpMessage.VALIDATION_ERROR,
    details?: Record<string, string[]>,
  ) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_ERROR, true, details);
  }
}

// ─── 401 Unauthorized ─────────────────────────────────────────────────────────

export class UnauthorizedError extends AppError {
  constructor(
    message: string = HttpMessage.UNAUTHORIZED,
    code: ErrorCodeType | string = ErrorCode.UNAUTHORIZED,
  ) {
    super(message, HttpStatus.UNAUTHORIZED, code, true);
  }
}

// ─── 403 Forbidden ────────────────────────────────────────────────────────────

export class ForbiddenError extends AppError {
  constructor(
    message: string = HttpMessage.FORBIDDEN,
    code: ErrorCodeType | string = ErrorCode.FORBIDDEN,
  ) {
    super(message, HttpStatus.FORBIDDEN, code, true);
  }
}

// ─── 404 Not Found ────────────────────────────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(
    message: string = HttpMessage.NOT_FOUND,
    code: ErrorCodeType | string = ErrorCode.NOT_FOUND,
  ) {
    super(message, HttpStatus.NOT_FOUND, code, true);
  }
}

// ─── 409 Conflict ────────────────────────────────────────────────────────────

export class ConflictError extends AppError {
  constructor(
    message: string = HttpMessage.CONFLICT,
    code: ErrorCodeType | string = ErrorCode.CONFLICT,
  ) {
    super(message, HttpStatus.CONFLICT, code, true);
  }
}

// ─── 429 Too Many Requests ────────────────────────────────────────────────────

export class TooManyRequestsError extends AppError {
  constructor(message: string = HttpMessage.TOO_MANY_REQUESTS) {
    super(message, HttpStatus.TOO_MANY_REQUESTS, ErrorCode.RATE_LIMIT_EXCEEDED, true);
  }
}

// ─── 500 Internal Server Error ────────────────────────────────────────────────

/**
 * Use for unexpected programmer errors only.
 * isOperational = false → triggers alert in the global error handler.
 */
export class InternalServerError extends AppError {
  constructor(message: string = HttpMessage.INTERNAL_ERROR) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR, false);
  }
}

// ─── Auth-specific convenience errors ─────────────────────────────────────────

export class TokenExpiredError extends UnauthorizedError {
  constructor() {
    super('Access token has expired. Please refresh your session.', ErrorCode.TOKEN_EXPIRED);
  }
}

export class TokenInvalidError extends UnauthorizedError {
  constructor() {
    super('Invalid or malformed access token.', ErrorCode.TOKEN_INVALID);
  }
}

export class TokenMissingError extends UnauthorizedError {
  constructor() {
    super('No access token provided. Include a Bearer token in the Authorization header.', ErrorCode.TOKEN_MISSING);
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Invalid email or password.', ErrorCode.INVALID_CREDENTIALS);
  }
}

export class AccountDisabledError extends ForbiddenError {
  constructor() {
    super('Your account has been suspended. Contact your administrator.', ErrorCode.ACCOUNT_DISABLED);
  }
}

// ─── Database-specific errors ─────────────────────────────────────────────────

export class DuplicateKeyError extends ConflictError {
  constructor(field: string) {
    super(`A record with this ${field} already exists.`, ErrorCode.DUPLICATE_KEY);
  }
}

export class DatabaseError extends InternalServerError {
  constructor(message = 'A database error occurred.') {
    super(message);
  }
}
