/**
 * Zod Validation Middleware.
 *
 * Generic middleware factory that validates request body, query params,
 * and/or URL params against a Zod schema.
 *
 * Validation errors are converted to ValidationError (422) with field-level
 * details matching the frontend's ApiError.details shape.
 *
 * @example
 * import { z } from 'zod';
 * import { validate } from '@middlewares/validation.middleware';
 *
 * const loginSchema = z.object({
 *   body: z.object({
 *     email: z.string().email(),
 *     password: z.string().min(8),
 *   }),
 * });
 *
 * router.post('/login', validate(loginSchema), asyncHandler(authController.login));
 */

import type { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError } from '../errors/HttpErrors';

// ─── Request Schema Shape ─────────────────────────────────────────────────────

/**
 * A Zod schema that can validate any combination of body, query, params.
 */
export type RequestSchema = z.ZodObject<{
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
}>;

// ─── Error Formatter ──────────────────────────────────────────────────────────

/**
 * Converts a ZodError into the field-level details map expected by the frontend.
 *
 * @example
 * // Input ZodError issues:
 * // [{ path: ['body', 'email'], message: 'Invalid email' }]
 * // Output:
 * // { email: ['Invalid email'] }
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    // Strip the leading 'body' / 'query' / 'params' segment for cleaner output
    const pathParts = issue.path.slice(1).map(String);
    const key = pathParts.length > 0 ? pathParts.join('.') : '_root';

    if (!details[key]) {
      details[key] = [];
    }
    details[key].push(issue.message);
  }

  return details;
}

// ─── Validate Middleware ──────────────────────────────────────────────────────

/**
 * Returns validation middleware for the given request schema.
 *
 * @param schema - A Zod object with optional `body`, `query`, `params` keys.
 */
export function validate(schema: RequestSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const details = formatZodErrors(result.error);
      return next(new ValidationError('Request validation failed', details));
    }

    // Overwrite with the parsed (coerced + stripped) data
    if (result.data.body !== undefined) req.body = result.data.body;
    if (result.data.query !== undefined) (req as Request).query = result.data.query as Record<string, string>;
    if (result.data.params !== undefined) req.params = result.data.params as Record<string, string>;

    next();
  };
}

// ─── Convenience Wrappers ─────────────────────────────────────────────────────

/**
 * Validates only the request body.
 */
export function validateBody<T extends z.ZodTypeAny>(bodySchema: T) {
  return validate(z.object({ body: bodySchema }));
}

/**
 * Validates only the query string.
 */
export function validateQuery<T extends z.ZodTypeAny>(querySchema: T) {
  return validate(z.object({ query: querySchema }));
}

/**
 * Validates only URL params.
 */
export function validateParams<T extends z.ZodTypeAny>(paramsSchema: T) {
  return validate(z.object({ params: paramsSchema }));
}
