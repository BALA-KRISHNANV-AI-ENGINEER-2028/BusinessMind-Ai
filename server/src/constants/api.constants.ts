/**
 * API-layer constants.
 *
 * Defines versioning, route prefixes, and rate-limit windows used across
 * routes, middleware, and the Express app factory.
 *
 * All route strings use trailing-slash-free convention: /api/v1/auth
 */

// ─── Versioning ───────────────────────────────────────────────────────────────

export const API_VERSION = 'v1' as const;
export const API_PREFIX = '/api' as const;
export const API_V1_PREFIX = `${API_PREFIX}/${API_VERSION}` as const; // /api/v1

// ─── Route Segments ───────────────────────────────────────────────────────────

/**
 * Module-level route segments mounted under API_V1_PREFIX.
 *
 * @example
 * router.use(API_ROUTES.AUTH, authRoutes);  // → /api/v1/auth
 */
export const API_ROUTES = {
  // Health (mounted at /api level — no version)
  HEALTH: '/health',

  // Versioned module routes
  AUTH: '/auth',
  USERS: '/users',
  ORGANIZATIONS: '/organizations',
  DOCUMENTS: '/documents',
  KNOWLEDGE_BASE: '/knowledge-base',
  AI: '/ai',
  RECOMMENDATIONS: '/recommendations',
  ANALYTICS: '/analytics',
  CHAT: '/chat',
  SETTINGS: '/settings',
} as const;

export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES];

// ─── Rate Limit Windows ───────────────────────────────────────────────────────

/**
 * Separate rate-limit windows per sensitivity tier.
 * Used by rateLimiter.middleware.ts factory.
 */
export const RATE_LIMIT = {
  /** Default global limit — applied to all routes. */
  GLOBAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  },
  /** Stricter limit for auth endpoints (login, register, password reset). */
  AUTH: {
    windowMs: 15 * 60 * 1000,
    max: 20,
  },
  /** Very strict limit for expensive AI/chat operations. */
  AI: {
    windowMs: 60 * 1000, // 1 minute
    max: 10,
  },
  /** Upload endpoint limits. */
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,
  },
} as const;

// ─── Request Header Names ──────────────────────────────────────────────────────

export const HEADERS = {
  REQUEST_ID: 'X-Request-ID',
  API_VERSION: 'X-API-Version',
  RATE_LIMIT_LIMIT: 'X-RateLimit-Limit',
  RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
  RATE_LIMIT_RESET: 'X-RateLimit-Reset',
} as const;

// ─── Content Types ─────────────────────────────────────────────────────────────

export const CONTENT_TYPE = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  PLAIN_TEXT: 'text/plain',
} as const;

// ─── Request Body Limits ──────────────────────────────────────────────────────

export const BODY_LIMIT = {
  JSON: '10mb',
  URL_ENCODED: '10mb',
} as const;
