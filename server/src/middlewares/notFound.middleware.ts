/**
 * 404 Not Found middleware.
 *
 * Catches any request that falls through all registered routes
 * and responds with the standard error envelope.
 *
 * Must be registered AFTER all routers in app.ts.
 */

import type { Request, Response } from 'express';
import { HttpStatus, HttpMessage, ErrorCode } from '../constants/http.constants';

export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(HttpStatus.NOT_FOUND).json({
    success: false,
    message: `${HttpMessage.ROUTE_NOT_FOUND}: ${req.method} ${req.originalUrl}`,
    code: ErrorCode.NOT_FOUND,
    requestId: req.requestId,
  });
}
