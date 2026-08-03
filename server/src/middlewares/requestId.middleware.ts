/**
 * Request ID middleware.
 *
 * Attaches a unique UUID v4 to every incoming request as req.requestId.
 * The ID is:
 * - Honoured from the incoming X-Request-ID header (for client-driven tracing).
 * - Generated fresh if the header is absent.
 * - Echoed back in the X-Request-ID response header for client-side correlation.
 *
 * This must be the FIRST middleware registered in app.ts so that
 * every log entry, error, and response has a traceable request ID.
 */

import type { Request, Response, NextFunction } from 'express';
import { generateId } from '../utils/uuid.util';
import { HEADERS } from '../constants/api.constants';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Use the client-provided request ID if present (forwarded from API gateways, load balancers)
  const existingId = req.headers[HEADERS.REQUEST_ID.toLowerCase()] as string | undefined;
  const requestId = existingId?.trim() || generateId();

  // Attach to request object (available in controllers and error handler)
  req.requestId = requestId;

  // Echo back in response headers for client-side log correlation
  res.setHeader(HEADERS.REQUEST_ID, requestId);

  next();
}
