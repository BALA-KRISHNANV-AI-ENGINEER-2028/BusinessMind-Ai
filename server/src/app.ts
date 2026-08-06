/**
 * Express Application Factory.
 *
 * Creates and configures the Express app instance.
 * This is a pure factory function — it has NO side effects like starting
 * the HTTP server or connecting to the database. Those happen in server.ts.
 *
 * Middleware pipeline order (critical — do NOT reorder without understanding implications):
 *
 *  1. requestIdMiddleware    — Must be first: attaches req.requestId for all logging
 *  2. httpLoggerMiddleware   — HTTP request/response logging (needs requestId)
 *  3. helmet                 — Security headers (must be early)
 *  4. cors                   — CORS policy (before route handlers)
 *  5. globalLimiter          — Rate limiting (before body parsing — rejects early)
 *  6. express.json           — JSON body parser
 *  7. express.urlencoded     — Form body parser
 *  8. sanitizeRequest        — Input sanitisation (after parsing, before validation)
 *  9. API_PREFIX /health     — Shallow health check (no auth needed)
 * 10. API_V1_PREFIX routes   — All versioned module routes
 * 11. notFoundMiddleware      — 404 handler (after all routes)
 * 12. errorMiddleware         — Global error handler (always last)
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { corsOptions } from './config/cors.config';
import { requestIdMiddleware } from './middlewares/requestId.middleware';
import { httpLoggerMiddleware } from './middlewares/logger.middleware';
import { sanitizeRequest } from './middlewares/sanitize.middleware';
import { globalLimiter } from './middlewares/rateLimiter.middleware';
import { notFoundMiddleware } from './middlewares/notFound.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { healthRouter } from './routes/health.routes';
import { apiV1Router } from './routes/index';
import { API_PREFIX, API_V1_PREFIX } from './constants/api.constants';
import { BODY_LIMIT } from './constants/api.constants';
import { HEADERS } from './constants/api.constants';
import { APP } from './constants/app.constants';

export function createApp(): express.Application {
  const app = express();

  // ── 1. Request ID ─────────────────────────────────────────────────────────
  app.use(requestIdMiddleware);

  // ── 2. HTTP Logger ────────────────────────────────────────────────────────
  app.use(httpLoggerMiddleware);

  // ── 3. Security Headers (Helmet) ──────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false, // Required for Atlas/browser API calls
      hsts: {
        maxAge: 31_536_000,         // 1 year
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // ── 4. CORS ───────────────────────────────────────────────────────────────
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions)); // Enable preflight for all routes

  // ── 5. Global Rate Limiter ────────────────────────────────────────────────
  app.use(globalLimiter);

  // ── 6 & 7. Body Parsers & Cookie Parser ───────────────────────────────────
  app.use(express.json({ limit: BODY_LIMIT.JSON }));
  app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT.URL_ENCODED }));
  app.use(cookieParser());

  // ── 8. Input Sanitisation ─────────────────────────────────────────────────
  app.use(sanitizeRequest);

  // ── Set API version response header ───────────────────────────────────────
  app.use((_req, res, next) => {
    res.setHeader(HEADERS.API_VERSION, 'v1');
    next();
  });

  // ── 9. Shallow Health Check (no auth, no version prefix) ─────────────────
  app.use(`${API_PREFIX}/health`, healthRouter);

  // ── 10. Versioned API Routes ──────────────────────────────────────────────
  app.use(API_V1_PREFIX, apiV1Router);

  // ── Trust proxy (for rate limiting IP detection behind load balancers) ────
  app.set('trust proxy', 1);

  // ── Disable X-Powered-By header ───────────────────────────────────────────
  app.disable('x-powered-by');

  // ── App metadata ──────────────────────────────────────────────────────────
  app.set('app-name', APP.NAME);
  app.set('app-version', APP.VERSION);

  // ── 11. 404 Handler (after all routes) ───────────────────────────────────
  app.use(notFoundMiddleware);

  // ── 12. Global Error Handler (always last) ────────────────────────────────
  app.use(errorMiddleware);

  return app;
}
