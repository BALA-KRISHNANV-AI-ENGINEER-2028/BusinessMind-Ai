/**
 * HTTP Request Logger Middleware.
 *
 * Uses pino-http to emit structured JSON logs for every incoming request.
 *
 * Each log entry includes:
 * - requestId (from req.requestId, set by requestId.middleware.ts)
 * - method, url, statusCode, responseTime
 * - In development: human-readable via pino-pretty transport.
 * - In production: raw JSON for log aggregators.
 *
 * Sensitive headers (Authorization, Cookie) are automatically redacted
 * by the Pino logger config.
 *
 * Registration order: AFTER requestIdMiddleware, BEFORE route handlers.
 */

import pinoHttp from 'pino-http';
import { logger } from '../config/logger.config';
import { config } from '../config/index';

export const httpLoggerMiddleware = pinoHttp({
  // Reuse the application logger so all logs share the same config
  logger,

  // Use req.requestId as the correlation ID in every log line
  genReqId: (req) => (req as { requestId?: string }).requestId ?? 'unknown',

  // Skip logging for health check endpoints to reduce noise
  autoLogging: {
    ignore: (req) => req.url === '/api/health' || req.url === '/api/v1/health',
  },

  // Log level per response status
  customLogLevel: (_req, res, err) => {
    if (err) return 'error';
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },

  // Custom success / error message
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} → ${res.statusCode}`,

  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} → ${res.statusCode} — ${err.message}`,

  // Serialise request: include method, url, headers (minus sensitive ones)
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      // Authorization and Cookie are redacted by Pino's redact config
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },

  // In development, use quietReqLogger to avoid double-logging with pino-pretty
  quietReqLogger: config.isDevelopment,
});
