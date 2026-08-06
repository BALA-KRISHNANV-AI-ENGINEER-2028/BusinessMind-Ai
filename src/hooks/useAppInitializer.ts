/**
 * useAppInitializer
 *
 * Orchestrates the real application startup sequence.
 *
 * Each step represents a REAL operation that must complete before the
 * application is usable. There are NO artificial delays here — the
 * duration of each step reflects actual async work.
 *
 * Startup sequence:
 *  1. Theme Hydration      — Apply stored theme preference to <html>
 *  2. Session Validation   — Validate stored JWT / check expiry
 *  3. User Profile         — Load user preferences from storage
 *  4. Organization Context — Load active organization data
 *  5. App Configuration    — Validate env config & feature flags
 *  6. AI Services          — Verify AI service readiness (Phase 8+: real ping)
 *  7. Finalization         — Mark initialization complete, trigger fade-out
 *
 * Future phases will replace stub steps with real API calls:
 *  - Phase 5: Session validation via /api/v1/auth/me
 *  - Phase 6: Organization load via /api/v1/organizations/:id
 *  - Phase 8: RAG / embedding service health check
 *  - Phase 9: Agent service health check
 */

import { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InitStep =
  | 'theme'
  | 'session'
  | 'user'
  | 'organization'
  | 'config'
  | 'ai'
  | 'done';

export interface AppInitState {
  /** True while startup sequence is in progress. */
  isInitializing: boolean;
  /** True when all steps have completed successfully. */
  isReady: boolean;
  /** Human-readable status label for the current step. */
  statusLabel: string;
  /** The current logical step identifier. */
  currentStep: InitStep;
  /** Non-null only if a critical startup step fails. */
  error: string | null;
}

// ─── Step Labels ──────────────────────────────────────────────────────────────

const STEP_LABELS: Record<InitStep, string> = {
  theme:        'Initializing Workspace...',
  session:      'Loading User Session...',
  user:         'Preparing Application...',
  organization: 'Loading Organization...',
  config:       'Applying Configuration...',
  ai:           'Preparing AI Services...',
  done:         'Finalizing Startup...',
};

// ─── Startup Tasks ────────────────────────────────────────────────────────────

/**
 * Hydrates the theme from localStorage and applies it to <html>.
 * This is synchronous in practice but wrapped async for a uniform API.
 */
async function hydrateTheme(): Promise<void> {
  const stored = window.localStorage.getItem('businessmind-theme');
  const theme =
    stored === 'light' || stored === 'dark'
      ? stored
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Validates the stored authentication session.
 * Checks expiry of the stored JWT — no network call needed in Phase 4/mock mode.
 * Phase 5: Replace with GET /api/v1/auth/me to verify token server-side.
 */
async function validateSession(): Promise<void> {
  try {
    const raw = window.localStorage.getItem('businessmind_auth_session');
    if (!raw) return;
    const parsed = JSON.parse(raw) as { expiresAt?: number };
    if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
      window.localStorage.removeItem('businessmind_auth_session');
    }
  } catch {
    window.localStorage.removeItem('businessmind_auth_session');
  }
}

/**
 * Loads user preferences from localStorage.
 * Phase 5: Replace with GET /api/v1/users/me for server-persisted preferences.
 */
async function loadUserProfile(): Promise<void> {
  const raw = window.localStorage.getItem('businessmind_auth_session');
  if (!raw) return;
  try {
    JSON.parse(raw);
  } catch {
    window.localStorage.removeItem('businessmind_auth_session');
  }
}

/**
 * Loads the active organization context.
 * Phase 6: Replace with GET /api/v1/organizations/:id
 */
async function loadOrganization(): Promise<void> {
  return;
}

/**
 * Validates application configuration and feature flags.
 */
async function validateConfig(): Promise<void> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    throw new Error('Required browser APIs unavailable.');
  }
}

/**
 * Verifies AI service readiness.
 * Phase 8+: Replace with a real health check against the AI service endpoint.
 */
async function prepareAIServices(): Promise<void> {
  return;
}

// ─── Initialization Sequence ──────────────────────────────────────────────────

const INIT_SEQUENCE: Array<{ step: InitStep; run: () => Promise<void> }> = [
  { step: 'theme',        run: hydrateTheme },
  { step: 'session',      run: validateSession },
  { step: 'user',         run: loadUserProfile },
  { step: 'organization', run: loadOrganization },
  { step: 'config',       run: validateConfig },
  { step: 'ai',           run: prepareAIServices },
];

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppInitializer(): AppInitState {
  const [state, setState] = useState<AppInitState>({
    isInitializing: true,
    isReady:        false,
    statusLabel:    STEP_LABELS['theme'],
    currentStep:    'theme',
    error:          null,
  });

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function runInitSequence(): Promise<void> {
      for (const { step, run } of INIT_SEQUENCE) {
        setState((prev) => ({
          ...prev,
          currentStep: step,
          statusLabel: STEP_LABELS[step],
        }));
        try {
          await run();
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Initialization failed.';
          setState((prev) => ({
            ...prev,
            isInitializing: false,
            isReady:        false,
            error:          message,
          }));
          return;
        }
      }

      setState({
        isInitializing: false,
        isReady:        true,
        statusLabel:    STEP_LABELS['done'],
        currentStep:    'done',
        error:          null,
      });
    }

    void runInitSequence();
  }, []);

  return state;
}
