/**
 * Master configuration loader.
 *
 * Single source of truth for all runtime configuration. Reads from
 * process.env (populated by dotenv in server.ts), validates required vars,
 * and exports a frozen, typed `config` object consumed throughout the app.
 *
 * Pattern: fail fast — if a required env var is missing, throw at startup
 * rather than crashing at the first usage point deep in request handling.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env file relative to the server root (one level up from src/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Reads a required environment variable. Throws if missing or empty.
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(
      `[Config] Missing required environment variable: "${key}". ` +
        'Check your .env file against .env.example.',
    );
  }
  return value.trim();
}

/**
 * Reads an optional environment variable with a fallback default.
 */
export function optionalEnv(key: string, defaultValue: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : defaultValue;
}

/**
 * Reads a required integer environment variable.
 */
export function requireEnvInt(key: string): number {
  const value = requireEnv(key);
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(
      `[Config] Environment variable "${key}" must be a valid integer, got: "${value}".`,
    );
  }
  return parsed;
}

/**
 * Reads an optional integer environment variable with a fallback default.
 */
function optionalEnvInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value || value.trim() === '') return defaultValue;
  const parsed = parseInt(value.trim(), 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// ─── Config Object ────────────────────────────────────────────────────────────

const nodeEnv = optionalEnv('NODE_ENV', 'development') as
  | 'development'
  | 'production'
  | 'test';

export const config = Object.freeze({
  /** Runtime environment. */
  env: nodeEnv,

  /** Convenience booleans. */
  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',

  server: {
    port: optionalEnvInt('PORT', 8000),
    host: optionalEnv('HOST', '0.0.0.0'),
  },

  database: {
    uri: optionalEnv(
      'MONGODB_URI',
      'mongodb://127.0.0.1:27017/businessmind-ai',
    ),
    dbName: optionalEnv('MONGODB_DB_NAME', 'businessmind-ai'),
    maxPoolSize: optionalEnvInt('MONGODB_MAX_POOL_SIZE', 10),
  },

  jwt: {
    secret: optionalEnv('JWT_SECRET', 'dev-secret-change-in-production'),
    expiresIn: optionalEnv('JWT_EXPIRES_IN', '15m'),
    refreshSecret: optionalEnv(
      'JWT_REFRESH_SECRET',
      'dev-refresh-secret-change-in-production',
    ),
    refreshExpiresIn: optionalEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  cors: {
    /** Comma-separated origins string → array. */
    origins: optionalEnv(
      'CORS_ORIGINS',
      'http://localhost:5173,http://localhost:3000',
    )
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  },

  rateLimit: {
    windowMs: optionalEnvInt('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 min
    maxRequests: optionalEnvInt('RATE_LIMIT_MAX_REQUESTS', 100),
  },

  logging: {
    level: optionalEnv('LOG_LEVEL', nodeEnv === 'production' ? 'info' : 'debug'),
  },

  api: {
    version: optionalEnv('API_VERSION', 'v1'),
    prefix: '/api',
  },

  /** Google OAuth credentials. Required for Google Sign-In to function. */
  google: {
    clientId: process.env['GOOGLE_CLIENT_ID'] ?? '',
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
    callbackUrl: process.env['GOOGLE_CALLBACK_URL'] ?? '',
    /**
     * The URL of the deployed frontend — used to redirect after OAuth callback.
     * Required in production: if missing the server intentionally fails fast
     * rather than silently redirecting OAuth users to localhost:5173.
     */
    frontendUrl:
      nodeEnv === 'production'
        ? requireEnv('FRONTEND_URL')
        : optionalEnv('FRONTEND_URL', 'http://localhost:5173'),
  },

  /** Multer file upload settings — prepared for Phase 5. */
  upload: {
    maxFileSizeBytes: 25 * 1024 * 1024, // 25 MB
    acceptedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ] as const,
  },

  /**
   * Phase 7 — RAG Foundation configuration.
   * All values are sourced from environment variables with safe defaults.
   */
  rag: {
    // ─── Embedding Provider ───────────────────────────────────────────────────
    /**
     * Embedding provider selection.
     * "openai" = production (requires EMBEDDING_API_KEY)
     * "mock"   = development / testing (no API key required)
     */
    embeddingProvider: optionalEnv('EMBEDDING_PROVIDER', 'mock'),

    /**
     * Embedding model name.
     * Default: text-embedding-3-small (1536 dims, $0.020/M tokens)
     */
    embeddingModel: optionalEnv('EMBEDDING_MODEL', 'text-embedding-3-small'),

    /**
     * Number of dimensions in the output embedding vector.
     * MUST match the numDimensions configured in the Atlas Vector Search index.
     * Changing this after index creation requires dropping and recreating the index.
     */
    embeddingDimensions: parseInt(optionalEnv('EMBEDDING_DIMENSIONS', '1536'), 10),

    /**
     * API key for the selected embedding provider.
     * Server-side only — NEVER exposed to the browser.
     */
    embeddingApiKey: optionalEnv('EMBEDDING_API_KEY', ''),

    // ─── Chunking ─────────────────────────────────────────────────────────────
    /**
     * Target chunk size in characters.
     * Default: 1000 (~250 tokens). Rationale: fits OpenAI 8191-token limit,
     * provides meaningful context per chunk, balanced chunk count.
     */
    chunkSize: parseInt(optionalEnv('CHUNK_SIZE', '1000'), 10),

    /**
     * Character overlap between adjacent chunks.
     * Default: 200 (~20% of 1000). Preserves boundary context.
     */
    chunkOverlap: parseInt(optionalEnv('CHUNK_OVERLAP', '200'), 10),

    // ─── Retrieval ─────────────────────────────────────────────────────────────
    /**
     * Default number of chunks to return per retrieval query.
     * Can be overridden per-request (max: 20).
     */
    retrievalTopK: parseInt(optionalEnv('RETRIEVAL_TOP_K', '5'), 10),

    /**
     * Minimum cosine similarity score for retrieved chunks (0.0–1.0).
     * Default: 0.70 — empirically good balance between precision and recall
     * for business documents. Below 0.5 is usually noise; above 0.85 is too strict.
     */
    retrievalMinScore: parseFloat(optionalEnv('RETRIEVAL_MIN_SCORE', '0.70')),

    /**
     * Name of the MongoDB Atlas Vector Search index on the documentchunks collection.
     * Must match the index created in Atlas UI (see ATLAS_VECTOR_INDEX.md).
     */
    vectorIndexName: optionalEnv('VECTOR_INDEX_NAME', 'document_chunk_vector_index'),
  },
});


// ─── Type Export ──────────────────────────────────────────────────────────────

export type AppConfig = typeof config;

// Named re-exports for convenience
export const { server, database, jwt, cors, rateLimit, logging, api } = config;
