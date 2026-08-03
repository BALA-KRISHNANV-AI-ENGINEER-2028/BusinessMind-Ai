/**
 * Pino logger factory.
 *
 * Creates a structured JSON logger (Pino) with transport selected by environment:
 * - development: pino-pretty for human-readable colourised output
 * - production:  raw JSON to stdout for ingestion by log aggregators (Datadog, etc.)
 *
 * Usage:
 *   import { logger } from './config/logger.config';
 *   logger.info({ userId }, 'User logged in');
 *   logger.error({ err }, 'Unhandled exception');
 */

import pino from 'pino';
import { config } from './index';

// ─── Log Levels ────────────────────────────────────────────────────────────────

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const level = (config.logging.level as LogLevel) ?? 'info';

// ─── Transport ────────────────────────────────────────────────────────────────

/**
 * Build the Pino transport configuration.
 *
 * pino-pretty is used in development ONLY. In production we emit raw JSON
 * so that log aggregators can parse structured fields reliably.
 */
function buildTransport(): pino.TransportSingleOptions | undefined {
  if (config.isProduction) {
    // No transport wrapper needed — Pino writes JSON to stdout natively
    return undefined;
  }

  return {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
      ignore: 'pid,hostname',
      messageFormat: '{msg}',
      singleLine: false,
    },
  };
}

// ─── Logger Instance ──────────────────────────────────────────────────────────

const transport = buildTransport();

export const logger = pino({
  level,
  base: {
    app: 'businessmind-api',
    env: config.env,
    version: '1.0.0',
  },
  // Redact sensitive fields so they never appear in logs
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.currentPassword',
      'body.newPassword',
      'body.token',
      'body.refreshToken',
    ],
    censor: '[REDACTED]',
  },
  // ISO 8601 timestamps
  timestamp: pino.stdTimeFunctions.isoTime,
  // Serialise Error objects with stack traces
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  ...(transport ? { transport } : {}),
});

export type Logger = typeof logger;
