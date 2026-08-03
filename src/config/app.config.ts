/**
 * Application-wide configuration constants.
 *
 * Keep this file pure — no side effects, no imports from the rest of the app,
 * no env vars (use env.ts for those). Values here drive defaults across the
 * entire frontend and act as a single source of truth for magic numbers.
 *
 * @example
 * import { APP_CONFIG } from '@/config/app.config';
 * const { defaultPageSize } = APP_CONFIG.pagination;
 */

export const APP_CONFIG = {
  name: 'BusinessMind AI',
  version: '2.0.0',
  description: 'Enterprise AI-Powered Business Intelligence Platform',

  api: {
    version: 'v1',
    /** Default TanStack Query stale time — 1 minute. */
    defaultStaleTime: 60_000,
    /** Default TanStack Query garbage-collection time — 5 minutes. */
    defaultGcTime: 300_000,
    /** Number of retries before a query is marked as failed. */
    defaultRetries: 1,
  },

  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100] as const,
  },

  toast: {
    /** Maximum number of toasts visible at once. */
    maxCount: 5,
    /** Auto-dismiss delay in milliseconds. */
    defaultDurationMs: 5_000,
  },

  sidebar: {
    /** Width in px when the sidebar is collapsed (icon-only). */
    collapsedWidth: 64,
    /** Width in px when the sidebar is expanded. */
    expandedWidth: 256,
  },

  theme: {
    storageKey: 'businessmind-theme',
  },

  upload: {
    /** 25 MB file size limit. */
    maxFileSizeBytes: 25 * 1024 * 1024,
    acceptedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ] as const,
    acceptedExtensionsLabel: 'PDF, DOCX, XLSX up to 25 MB',
  },
} as const;
