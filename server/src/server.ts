/**
 * Server Bootstrap.
 *
 * Entry point for the BusinessMind AI backend.
 *
 * Responsibilities:
 * 1. Load environment variables (via config/index.ts → dotenv).
 * 2. Create the Express application.
 * 3. Connect to MongoDB Atlas.
 * 4. Start the HTTP server.
 * 5. Handle graceful shutdown on SIGTERM / SIGINT.
 *
 * Separation of concerns:
 * - app.ts    → Express configuration and middleware pipeline.
 * - server.ts → HTTP lifecycle, DB connection, process signal handling.
 * - lib/database.ts → MongoDB connection logic.
 */

import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './lib/database';
import { bootstrapDeveloperAccount } from './scripts/seedDeveloperAccount';
import { config } from './config/index';
import { logger } from './config/logger.config';
import { APP } from './constants/app.constants';
import type { Server } from 'http';

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  logger.info(
    { app: APP.NAME, version: APP.VERSION, env: config.env },
    '🚀 Starting server...',
  );

  // 1. Create Express app
  const app = createApp();

  // 2. Connect to MongoDB Atlas
  try {
    await connectDatabase();
  } catch (err) {
    logger.error({ err }, '❌ Failed to connect to database — aborting startup.');
    process.exit(1);
  }

  // 3. Idempotently bootstrap Developer / Admin account in production
  if (config.isProduction) {
    try {
      await bootstrapDeveloperAccount();
    } catch (err) {
      logger.error({ err }, '⚠️ Error during production developer account bootstrap.');
    }
  }

  // 4. Start HTTP server
  const server: Server = app.listen(config.server.port, config.server.host, () => {
    logger.info(
      {
        host: config.server.host,
        port: config.server.port,
        env: config.env,
        apiBase: `http://${config.server.host}:${config.server.port}/api/v1`,
      },
      `✅ ${APP.NAME} server running on http://${config.server.host}:${config.server.port}`,
    );
  });

  // ─── Graceful Shutdown ──────────────────────────────────────────────────────

  /**
   * Graceful shutdown handler.
   *
   * On SIGTERM / SIGINT:
   * 1. Stop accepting new connections.
   * 2. Wait for in-flight requests to complete (30s timeout).
   * 3. Disconnect from MongoDB.
   * 4. Exit cleanly.
   */
  async function shutdown(signal: string): Promise<void> {
    logger.info({ signal }, `📴 Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new requests
    server.close(async (err) => {
      if (err) {
        logger.error({ err }, 'Error closing HTTP server');
        process.exit(1);
      }

      logger.info('HTTP server closed. Disconnecting from database...');

      try {
        await disconnectDatabase();
        logger.info('✅ Graceful shutdown complete. Goodbye.');
        process.exit(0);
      } catch (disconnectErr) {
        logger.error({ err: disconnectErr }, 'Error during database disconnect');
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds if graceful shutdown hangs
    setTimeout(() => {
      logger.error('⚠️  Graceful shutdown timed out after 30s. Forcing exit.');
      process.exit(1);
    }, 30_000).unref();
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // ─── Unhandled Promise Rejections ──────────────────────────────────────────

  process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, '⚠️  Unhandled promise rejection — shutting down.');
    void shutdown('unhandledRejection');
  });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, '💥 Uncaught exception — shutting down immediately.');
    process.exit(1);
  });
}

// ─── Run ─────────────────────────────────────────────────────────────────────

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
