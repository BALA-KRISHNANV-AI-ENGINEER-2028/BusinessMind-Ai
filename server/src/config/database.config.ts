/**
 * MongoDB / Mongoose connection configuration.
 *
 * Centralises all database connection options, retry strategy, and health
 * check utilities. The actual connection is initiated in src/lib/database.ts.
 *
 * Phase 4: Configuration only — models are added in Phase 5.
 */

import mongoose from 'mongoose';
import { database } from './index';

// ─── Connection Options ────────────────────────────────────────────────────────

/**
 * Mongoose connection options.
 * Tuned for MongoDB Atlas — TLS is handled by the Atlas connection string.
 */
export const mongooseConnectionOptions: mongoose.ConnectOptions = {
  dbName: database.dbName,
  maxPoolSize: database.maxPoolSize,
  minPoolSize: 2,
  socketTimeoutMS: 45_000,
  serverSelectionTimeoutMS: 10_000,
  heartbeatFrequencyMS: 10_000,
  retryWrites: true,
  writeConcern: { w: 'majority' },
};

// ─── Retry Strategy ───────────────────────────────────────────────────────────

export const DB_RETRY_CONFIG = {
  /** Maximum number of connection attempts before giving up. */
  maxAttempts: 5,
  /** Initial delay in ms between retries. Doubles each attempt (exponential backoff). */
  initialDelayMs: 1_000,
  /** Maximum delay cap in ms. */
  maxDelayMs: 30_000,
} as const;

/**
 * Calculates the exponential back-off delay for retry attempt `n` (1-indexed).
 */
export function getRetryDelayMs(attempt: number): number {
  const delay = DB_RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt - 1);
  return Math.min(delay, DB_RETRY_CONFIG.maxDelayMs);
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export type DatabaseStatus = 'connected' | 'disconnected' | 'connecting' | 'disconnecting';

/**
 * Maps Mongoose readyState integer to a human-readable status string.
 */
export function getDatabaseStatus(): DatabaseStatus {
  const stateMap: Record<number, DatabaseStatus> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return stateMap[mongoose.connection.readyState] ?? 'disconnected';
}

/**
 * Returns true when Mongoose is fully connected and ready for queries.
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
