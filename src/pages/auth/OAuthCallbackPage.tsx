/**
 * OAuthCallbackPage
 *
 * Handles the frontend leg of the Google OAuth redirect flow.
 *
 * Flow:
 *   Google → Backend /api/v1/auth/google/callback
 *     → Backend issues JWT
 *     → Backend redirects to /auth/callback?token=...&expiresAt=...
 *     → This page reads those params
 *     → Calls GET /api/v1/auth/me with the token to get full session
 *     → Sets session in AuthContext
 *     → Navigates to /
 *
 * On error (Google denied, config error, etc.):
 *   → Redirects to /login with an error toast
 */

import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/auth.api';
import { useToast } from '../../hooks/useToast';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { setSessionFromCallback } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const hasHandled = useRef(false);

  useEffect(() => {
    // Guard against double-execution in React StrictMode
    if (hasHandled.current) return;
    hasHandled.current = true;

    async function handleCallback() {
      const error = searchParams.get('error');
      const token = searchParams.get('token');
      const onboardingToken = searchParams.get('onboardingToken');
      const expiresAt = searchParams.get('expiresAt');
      const parsedExpiresAt = Number(expiresAt);

      // Google or backend returned an error
      if (error) {
        showToast({ title: error, variant: 'danger' });
        void navigate('/login', { replace: true });
        return;
      }

      // Case B: New Google User -> backend sent token to /onboarding
      if (onboardingToken) {
        void navigate(`/onboarding?token=${encodeURIComponent(onboardingToken)}`, { replace: true });
        return;
      }

      if (!token || !expiresAt || Number.isNaN(parsedExpiresAt)) {
        const message = 'Google sign-in was cancelled or failed.';
        showToast({ title: message, variant: 'danger' });
        void navigate('/login', { replace: true });
        return;
      }

      try {
        // Exchange the token for a full session (user, memberships, etc.)
        const session = await authApi.fetchSessionFromToken(token);

        // Override expiresAt with what the backend told us
        const fullSession = {
          ...session,
          token,
          expiresAt: parsedExpiresAt,
        };

        setSessionFromCallback(fullSession);
        showToast({ title: 'Signed in with Google', variant: 'success' });
        void navigate('/', { replace: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Authentication failed.';
        showToast({ title: message, variant: 'danger' });
        void navigate('/login', { replace: true });
      }
    }

    void handleCallback();
  }, []);

  return (
    <div className="flex h-svh w-full items-center justify-center bg-bg-base">
      <div className="flex flex-col items-center gap-4">
        <div className="size-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm text-text-secondary">Completing sign-in…</p>
      </div>
    </div>
  );
}
