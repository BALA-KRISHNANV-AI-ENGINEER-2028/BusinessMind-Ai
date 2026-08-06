/**
 * Real Authentication API Service.
 *
 * Connects frontend auth flows to backend /api/v1/auth REST endpoints.
 */

import { apiClient } from './api.client';
import type { AuthSession } from '../types/auth';
import { mockSession } from '../mocks/auth.mock';

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  organizationName?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthSession> {
    const res = await apiClient.post<AuthSession>('/auth/register', payload, {
      ...mockSession,
      user: { ...mockSession.user, email: payload.email, fullName: payload.fullName },
    });
    if (res.success) return res.data;
    throw new Error(res.message || 'Registration failed');
  },

  async login(payload: LoginPayload): Promise<AuthSession> {
    const res = await apiClient.post<AuthSession>('/auth/login', payload, {
      ...mockSession,
      user: { ...mockSession.user, email: payload.email },
    });
    if (res.success) return res.data;
    throw new Error(res.message || 'Login failed');
  },

  async loginWithGoogle(): Promise<AuthSession> {
    const res = await apiClient.post<AuthSession>(
      '/auth/google',
      { code: 'google-oauth-demo-code' },
      {
        ...mockSession,
        user: { ...mockSession.user, email: 'alex.rivera.google@businessmind.ai', fullName: 'Alex Rivera (Google)' },
      },
    );
    if (res.success) return res.data;
    throw new Error(res.message || 'Google login failed');
  },

  async refresh(): Promise<AuthSession> {
    const res = await apiClient.post<AuthSession>('/auth/refresh', {}, mockSession);
    if (res.success) return res.data;
    throw new Error(res.message || 'Session refresh failed');
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout', {});
  },

  async getMe(): Promise<AuthSession> {
    const res = await apiClient.get<AuthSession>('/auth/me', mockSession);
    if (res.success) return res.data;
    throw new Error(res.message || 'Session inspection failed');
  },
};
