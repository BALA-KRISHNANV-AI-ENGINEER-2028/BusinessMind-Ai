/**
 * Real Authentication API Service.
 *
 * Connects frontend auth flows to backend /api/v1/auth REST endpoints.
 *
 * ── Rules ──────────────────────────────────────────────────────────────────
 * - No mock/dummy fallbacks.
 * - All auth errors propagate to the caller — never silently swallowed.
 * - Google OAuth uses a backend redirect flow (not a POST with a fake code).
 */

import { apiClient } from './api.client';
import type { AuthSession } from '../types/auth';

const API_BASE_URL =
  (import.meta.env['VITE_API_BASE_URL'] as string) || 'http://localhost:8000/api/v1';

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  jobTitle?: string;
  phone?: string;
  avatarUrl?: string;
  companyName: string;
  companyWebsite?: string;
  industry?: string;
  companySize?: string;
  companyDescription?: string;
  country?: string;
  timezone?: string;
}

export interface CompleteOnboardingPayload {
  onboardingToken: string;
  fullName: string;
  jobTitle?: string;
  phone?: string;
  companyName: string;
  companyWebsite?: string;
  industry?: string;
  companySize?: string;
  companyDescription?: string;
  country?: string;
  timezone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthSession> {
    const res = await apiClient.post<AuthSession>('/auth/register', payload);
    if (res.success) return res.data;
    throw new Error(res.message || 'Registration failed');
  },

  async completeOnboarding(payload: CompleteOnboardingPayload): Promise<AuthSession> {
    const res = await apiClient.post<AuthSession>('/auth/onboarding/complete', payload);
    if (res.success) return res.data;
    throw new Error(res.message || 'Onboarding completion failed');
  },

  async login(payload: LoginPayload): Promise<AuthSession> {
    const res = await apiClient.post<AuthSession>('/auth/login', payload);
    if (res.success) return res.data;
    throw new Error(res.message || 'Login failed');
  },

  /**
   * Redirects the browser to the backend Google OAuth initiation URL.
   * The backend will redirect to Google, then back to /api/v1/auth/google/callback,
   * then finally to /auth/callback on the frontend with the session token.
   *
   * This is a browser navigation, not an API call — no return value.
   */
  initiateGoogleOAuth(): void {
    const initiateUrl = `${API_BASE_URL}/auth/google/initiate`;
    window.location.href = initiateUrl;
  },

  /**
   * Called by OAuthCallbackPage after Google OAuth redirects back to the frontend.
   * Fetches the full session using the token received from the callback URL.
   * Uses raw fetch so we can inject a specific Authorization header.
   */
  async fetchSessionFromToken(token: string): Promise<AuthSession> {
    const url = `${API_BASE_URL}/auth/me`;
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText })) as { message?: string };
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const json = await res.json() as { data?: AuthSession; success?: boolean; message?: string };
    if (json.data) return json.data;
    throw new Error(json.message || 'Failed to load session');
  },

  async refresh(): Promise<AuthSession> {
    const res = await apiClient.post<AuthSession>('/auth/refresh', {});
    if (res.success) return res.data;
    throw new Error(res.message || 'Session refresh failed');
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout', {});
  },

  async getMe(): Promise<AuthSession> {
    const res = await apiClient.get<AuthSession>('/auth/me');
    if (res.success) return res.data;
    throw new Error(res.message || 'Session inspection failed');
  },

  async updateProfile(data: { fullName?: string; jobTitle?: string; phone?: string; bio?: string; avatarUrl?: string }): Promise<AuthSession['user']> {
    const res = await apiClient.patch<AuthSession['user']>('/users/me', data);
    if (res.success) return res.data;
    throw new Error(res.message || 'Failed to update profile');
  },

  async updatePreferences(data: Partial<AuthSession['user']['preferences']>): Promise<AuthSession['user']> {
    const res = await apiClient.patch<AuthSession['user']>('/users/preferences', data);
    if (res.success) return res.data;
    throw new Error(res.message || 'Failed to update preferences');
  },
};
