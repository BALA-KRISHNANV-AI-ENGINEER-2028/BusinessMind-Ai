/**
 * Async handler utility.
 *
 * Wraps async Express route handlers / middleware to eliminate
 * repetitive try/catch blocks in controllers.
 *
 * Without asyncHandler every async controller needs:
 *   try { ... } catch(err) { next(err) }
 *
 * With asyncHandler:
 *   router.get('/:id', asyncHandler(controller.getById));
 *
 * Any thrown error (including AppError subclasses) is forwarded
 * to the global error middleware via next(err).
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async Express handler so that rejected promises are forwarded
 * to the next() error handler instead of causing unhandled rejections.
 *
 * @example
 * router.get('/:id', asyncHandler(async (req, res) => {
 *   const user = await userService.findById(req.params.id);
 *   sendSuccess(res, user);
 * }));
 */
export function asyncHandler<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, unknown>,
>(
  handler: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
