/**
 * Typed, centralised access to environment variables.
 *
 * Import this instead of reading `import.meta.env` directly in components
 * or services. This provides a single place to add validation, defaults,
 * and documentation for every env var the app depends on.
 *
 * @example
 * import { env } from '@/config/env';
 * const apiUrl = env.API_BASE_URL;
 */

interface EnvConfig {
  /** Base URL for the REST API. Required in Phase 4+. */
  readonly API_BASE_URL: string;
  /** Google OAuth client ID. Required in Phase 3+. */
  readonly GOOGLE_CLIENT_ID: string;
  /** MongoDB Atlas App Services application ID. Required in Phase 4+. */
  readonly MONGODB_APP_ID: string;
  /** Vite runtime mode. */
  readonly MODE: 'development' | 'production' | 'test';
  readonly DEV: boolean;
  readonly PROD: boolean;
}

export const env: EnvConfig = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? '',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  MONGODB_APP_ID: import.meta.env.VITE_MONGODB_APP_ID ?? '',
  MODE: (import.meta.env.MODE ?? 'development') as EnvConfig['MODE'],
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
};
