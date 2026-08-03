/**
 * Global Error Handler Middleware.
 *
 * The last Express error middleware in the chain.
 * Catches all errors forwarded via next(err) and converts them to the
 * standard ApiErrorResponse envelope.
 *
 * Error handling strategy:
 * 1. AppError (isOperational = true)  → log WARN, send structured JSON.
 * 2. Mongoose validation errors        → convert to ValidationError, send 422.
 * 3. Mongoose CastError (bad ObjectId) → convert to NotFoundError, send 404.
 * 4. JWT errors                        → handled upstream by auth middleware.
 * 5. Unexpected errors (isOperational = false) → log ERROR (alert-worthy), send 500.
 */

import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../errors/AppError';
import { ValidationError, NotFoundError, DuplicateKeyError } from '../errors/HttpErrors';
import { logger } from '../config/logger.config';
import { HttpStatus, HttpMessage, ErrorCode } from '../constants/http.constants';

// ─── Mongoose Error Converters ────────────────────────────────────────────────

function handleMongooseValidationError(
  err: mongoose.Error.ValidationError,
): ValidationError {
  const details: Record<string, string[]> = {};
  for (const [field, validationError] of Object.entries(err.errors)) {
    details[field] = [validationError.message];
  }
  return new ValidationError('Validation failed', details);
}

function handleMongooseCastError(err: mongoose.Error.CastError): NotFoundError {
  return new NotFoundError(`Invalid value for field "${err.path}": "${err.value}".`);
}

function handleDuplicateKeyError(err: { keyValue?: Record<string, unknown> }): DuplicateKeyError {
  const field = err.keyValue ? Object.keys(err.keyValue)[0] ?? 'field' : 'field';
  return new DuplicateKeyError(field);
}

// ─── Error Handler ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorMiddleware: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const requestId = req.requestId;

  // ── 1. Mongoose Validation Error ──────────────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    const appErr = handleMongooseValidationError(err);
    logger.warn({ requestId, err: appErr }, 'Mongoose validation error');
    res.status(appErr.statusCode).json(appErr.toJSON(requestId));
    return;
  }

  // ── 2. Mongoose Cast Error (invalid ObjectId) ─────────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    const appErr = handleMongooseCastError(err);
    logger.warn({ requestId, err: appErr }, 'Mongoose cast error');
    res.status(appErr.statusCode).json(appErr.toJSON(requestId));
    return;
  }

  // ── 3. MongoDB Duplicate Key Error (code 11000) ───────────────────────────
  const mongoErr = err as { code?: number; keyValue?: Record<string, unknown> };
  if (mongoErr.code === 11000) {
    const appErr = handleDuplicateKeyError(mongoErr);
    logger.warn({ requestId, err: appErr }, 'MongoDB duplicate key error');
    res.status(appErr.statusCode).json(appErr.toJSON(requestId));
    return;
  }

  // ── 4. Known AppError (operational) ──────────────────────────────────────
  if (err instanceof AppError) {
    if (err.isOperational) {
      logger.warn({ requestId, code: err.code, statusCode: err.statusCode }, err.message);
    } else {
      // Non-operational → programmer error, needs alerting
      logger.error({ requestId, err, stack: err.stack }, 'Non-operational error');
    }
    res.status(err.statusCode).json(err.toJSON(requestId));
    return;
  }

  // ── 5. Unknown / Unexpected Error ─────────────────────────────────────────
  const unknownErr = err instanceof Error ? err : new Error(String(err));
  logger.error({ requestId, err: unknownErr, stack: unknownErr.stack }, 'Unexpected error');

  // Never leak internal details to the client
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: HttpMessage.INTERNAL_ERROR,
    code: ErrorCode.INTERNAL_ERROR,
    requestId,
  });
};
