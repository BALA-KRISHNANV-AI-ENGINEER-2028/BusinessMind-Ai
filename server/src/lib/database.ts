/**
 * MongoDB Atlas Connection Manager.
 *
 * Manages the full lifecycle of the Mongoose connection:
 * - Initial connection with exponential back-off retry.
 * - Connection event listeners (connected, disconnected, error, reconnected).
 * - Graceful disconnect for shutdown.
 * - Health check utility.
 *
 * Usage (in server.ts):
 *   import { connectDatabase, disconnectDatabase } from './lib/database';
 *   await connectDatabase();          // On startup
 *   await disconnectDatabase();       // On shutdown
 */

import mongoose from 'mongoose';
import { logger } from '../config/logger.config';
import { database } from '../config/index';
import {
  mongooseConnectionOptions,
  DB_RETRY_CONFIG,
  getRetryDelayMs,
  getDatabaseStatus,
} from '../config/database.config';
import { configureMongoose } from './mongoose';

// ─── State ────────────────────────────────────────────────────────────────────

let isConnecting = false;

// ─── Event Listeners ─────────────────────────────────────────────────────────

/**
 * Attaches Mongoose connection event listeners.
 * Called once before the first connect() call.
 */
function attachConnectionListeners(): void {
  mongoose.connection.on('connected', () => {
    logger.info({ db: database.dbName }, '✅ MongoDB connected');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️  MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('🔄 MongoDB reconnected');
  });

  mongoose.connection.on('error', (err: Error) => {
    logger.error({ err }, '❌ MongoDB connection error');
  });

  mongoose.connection.on('close', () => {
    logger.info('MongoDB connection closed');
  });
}

// ─── Connect ─────────────────────────────────────────────────────────────────

/**
 * Connects to MongoDB Atlas with exponential back-off retry.
 *
 * @throws Error if all retry attempts are exhausted.
 */
export async function connectDatabase(): Promise<void> {
  if (isConnecting) {
    logger.warn('connectDatabase called while already connecting — skipping duplicate call');
    return;
  }

  // Already connected
  if (mongoose.connection.readyState === 1) {
    logger.debug('MongoDB already connected — skipping reconnect');
    return;
  }

  isConnecting = true;

  // Apply global Mongoose config before first connection
  configureMongoose();
  attachConnectionListeners();

  let attempt = 0;

  while (attempt < DB_RETRY_CONFIG.maxAttempts) {
    attempt++;
    try {
      logger.info(
        { attempt, maxAttempts: DB_RETRY_CONFIG.maxAttempts, uri: maskUri(database.uri) },
        `Connecting to MongoDB (attempt ${attempt}/${DB_RETRY_CONFIG.maxAttempts})...`,
      );

      await mongoose.connect(database.uri, mongooseConnectionOptions);
      isConnecting = false;
      return; // Success

    } catch (err) {
      const isLastAttempt = attempt >= DB_RETRY_CONFIG.maxAttempts;

      if (isLastAttempt) {
        isConnecting = false;
        logger.error({ err, attempt }, '❌ All MongoDB connection attempts failed.');
        throw new Error(
          `Failed to connect to MongoDB after ${DB_RETRY_CONFIG.maxAttempts} attempts.`,
        );
      }

      const delayMs = getRetryDelayMs(attempt);
      logger.warn(
        { err, attempt, retryInMs: delayMs },
        `MongoDB connection attempt ${attempt} failed. Retrying in ${delayMs}ms...`,
      );

      await sleep(delayMs);
    }
  }

  isConnecting = false;
}

// ─── Disconnect ───────────────────────────────────────────────────────────────

/**
 * Gracefully disconnects from MongoDB.
 * Should be called during application shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    logger.debug('MongoDB already disconnected — nothing to do');
    return;
  }

  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  } catch (err) {
    logger.error({ err }, 'Error during MongoDB disconnect');
    throw err;
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────

/**
 * Returns the current database connection health.
 */
export function getDatabaseHealth(): {
  status: string;
  connected: boolean;
  dbName: string;
} {
  return {
    status: getDatabaseStatus(),
    connected: mongoose.connection.readyState === 1,
    dbName: database.dbName,
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Masks sensitive credentials in a MongoDB URI for safe logging. */
function maskUri(uri: string): string {
  try {
    const url = new URL(uri);
    if (url.password) url.password = '***';
    if (url.username) url.username = url.username.slice(0, 3) + '***';
    return url.toString();
  } catch {
    return uri.replace(/\/\/.*@/, '//***:***@');
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
