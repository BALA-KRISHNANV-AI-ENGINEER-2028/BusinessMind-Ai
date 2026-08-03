/**
 * Typed process.env interface.
 *
 * Augments the NodeJS.ProcessEnv namespace so that TypeScript enforces
 * correct types when reading from process.env anywhere in the app.
 *
 * Note: All values remain `string | undefined` in the NodeJS type system
 * (env vars are always strings). The config/index.ts loader is responsible
 * for coercing types, validating presence, and applying defaults.
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // ─── Server ────────────────────────────────────────────────────────────
      NODE_ENV?: 'development' | 'production' | 'test';
      PORT?: string;
      HOST?: string;

      // ─── MongoDB ───────────────────────────────────────────────────────────
      MONGODB_URI?: string;
      MONGODB_DB_NAME?: string;
      MONGODB_MAX_POOL_SIZE?: string;

      // ─── JWT ───────────────────────────────────────────────────────────────
      JWT_SECRET?: string;
      JWT_EXPIRES_IN?: string;
      JWT_REFRESH_SECRET?: string;
      JWT_REFRESH_EXPIRES_IN?: string;

      // ─── CORS ──────────────────────────────────────────────────────────────
      CORS_ORIGINS?: string;

      // ─── Rate Limiting ─────────────────────────────────────────────────────
      RATE_LIMIT_WINDOW_MS?: string;
      RATE_LIMIT_MAX_REQUESTS?: string;

      // ─── Logging ───────────────────────────────────────────────────────────
      LOG_LEVEL?: string;

      // ─── API ───────────────────────────────────────────────────────────────
      API_VERSION?: string;

      // ─── Google OAuth (Phase 5+) ───────────────────────────────────────────
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;
      GOOGLE_CALLBACK_URL?: string;
    }
  }
}

// This file must be a module (not a script) for declaration merging to work.
export {};
