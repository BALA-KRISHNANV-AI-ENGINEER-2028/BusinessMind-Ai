/**
 * Shared application constants.
 *
 * - ROUTES    — use these instead of hardcoded strings in <Link> and navigate().
 * - QUERY_KEYS — use these as TanStack Query key arrays (prevents key typos and
 *               makes cache invalidation explicit and discoverable).
 */

// ─── Route Paths ─────────────────────────────────────────────────────────────

export const ROUTES = {
  // Public
  LOGIN: '/login',

  // Protected — App Shell root
  DASHBOARD: '/',
  ASSISTANT: '/assistant',
  KNOWLEDGE_BASE: '/knowledge-base',
  DOCUMENTS: '/documents',
  RECOMMENDATIONS: '/recommendations',
  ANALYTICS: '/analytics',
  ORGANIZATIONS: '/organizations',

  // Settings — nested layout routes
  SETTINGS: '/settings',
  SETTINGS_GENERAL: '/settings/general',
  SETTINGS_NOTIFICATIONS: '/settings/notifications',
  SETTINGS_SECURITY: '/settings/security',

  // Profile — nested under settings layout
  SETTINGS_PROFILE: '/settings/profile',

  // Error pages
  UNAUTHORIZED: '/unauthorized',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

// ─── TanStack Query Key Factory ───────────────────────────────────────────────

export const QUERY_KEYS = {
  // Dashboard
  DASHBOARD_METRICS:          ['dashboard', 'metrics']          as const,
  DASHBOARD_AGENT_STATUSES:   ['dashboard', 'agentStatuses']    as const,
  DASHBOARD_RECENT_DECISIONS: ['dashboard', 'recentDecisions']  as const,
  DASHBOARD_RECENT_DOCUMENTS: ['dashboard', 'recentDocuments']  as const,
  DASHBOARD_RECOMMENDATIONS:  ['dashboard', 'recommendations']  as const,

  // Documents
  DOCUMENTS:          ['documents']         as const,
  DOCUMENT:  (id: string) => ['documents', id] as const,

  // Recommendations
  RECOMMENDATIONS: ['recommendations'] as const,

  // Analytics
  ANALYTICS_METRICS:         ['analytics', 'metrics']        as const,
  ANALYTICS_DECISION_VOLUME: ['analytics', 'decisionVolume'] as const,

  // AI Assistant
  CHAT_THREADS:           ['chat', 'threads']       as const,
  CHAT_THREAD: (id: string) => ['chat', 'threads', id] as const,

  // Organizations
  ORGANIZATION_MEMBERS: ['organizations', 'members'] as const,

  // Auth
  CURRENT_USER: ['auth', 'currentUser'] as const,
} as const;
