/**
 * Health Check Routes.
 *
 * Provides two health endpoints:
 *
 * GET /api/health        — Shallow ping (no DB). Load balancer liveness probe.
 * GET /api/v1/health     — Deep check (includes DB status). Readiness probe.
 *
 * Response shape matches ApiResponse<T> envelope so the frontend
 * api.client.ts can use it for connectivity checks.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDatabaseStatus, isDatabaseConnected } from '../config/database.config';
import { APP } from '../constants/app.constants';
import { HttpStatus } from '../constants/http.constants';
import { config } from '../config/index';

export const healthRouter = Router();

// ─── GET /api/health ─────────────────────────────────────────────────────────
// Shallow liveness probe — always returns 200 if the process is running.
healthRouter.get('/', (_req: Request, res: Response) => {
  res.status(HttpStatus.OK).json({
    success: true,
    data: {
      status: 'ok',
      app: APP.NAME,
      version: APP.VERSION,
      environment: config.env,
      timestamp: new Date().toISOString(),
    },
  });
});

// ─── GET /api/v1/health ───────────────────────────────────────────────────────
// Deep readiness probe — includes DB connectivity and uptime.
healthRouter.get('/detailed', (req: Request, res: Response) => {
  const dbConnected = isDatabaseConnected();
  const dbStatus = getDatabaseStatus();

  const statusCode = dbConnected ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

  res.status(statusCode).json({
    success: dbConnected,
    data: {
      status: dbConnected ? 'ok' : 'degraded',
      app: APP.NAME,
      version: APP.VERSION,
      environment: config.env,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      requestId: req.requestId,
      services: {
        database: {
          status: dbStatus,
          connected: dbConnected,
        },
      },
    },
  });
});
