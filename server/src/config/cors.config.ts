/**
 * CORS configuration.
 *
 * Defines the Cross-Origin Resource Sharing policy for the API.
 * Development is permissive; production locks down to explicit origins.
 *
 * The built CorsOptions object is consumed directly by the cors() middleware
 * in src/app.ts.
 */

import type { CorsOptions } from 'cors';
import { config } from './index';

// ─── Allowed Headers ───────────────────────────────────────────────────────────

const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Request-ID',
  'X-API-Version',
] as const;

const EXPOSED_HEADERS = [
  'X-Request-ID',
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
] as const;

const ALLOWED_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
] as const;

// ─── Origin Validator ─────────────────────────────────────────────────────────

/**
 * Dynamic origin validator.
 *
 * - In development: allows all origins (useful for Postman, mobile emulators).
 * - In production: restricts to the explicit whitelist from CORS_ORIGINS env var.
 */
function createOriginValidator(
  allowedOrigins: string[],
): CorsOptions['origin'] {
  if (config.isDevelopment) {
    // Allow all in dev — no need to whitelist every local tool
    return true;
  }

  return (origin, callback) => {
    // Allow server-to-server requests (no origin header, e.g. curl, Postman)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(
        new Error(
          `CORS policy violation: Origin "${origin}" is not in the allowed list.`,
        ),
      );
    }
  };
}

// ─── Exported CORS Options ────────────────────────────────────────────────────

export const corsOptions: CorsOptions = {
  origin: createOriginValidator(config.cors.origins),
  methods: [...ALLOWED_METHODS],
  allowedHeaders: [...ALLOWED_HEADERS],
  exposedHeaders: [...EXPOSED_HEADERS],
  credentials: true, // Required for cookies / Authorization header
  maxAge: 86_400,    // Preflight cache: 24 hours
  optionsSuccessStatus: 200, // IE11 compatibility
};
