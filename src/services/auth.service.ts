import { apiClient } from './api.client';
import type { ApiResult } from '../types/api';
import type { User, AuthSession } from '../types/auth';
import { mockUser, mockSession } from '../mocks/auth.mock';

export const authService = {
  async getCurrentUser(): Promise<ApiResult<User>> {
    return apiClient.get(mockUser);
  },

  async login(email: string): Promise<ApiResult<AuthSession>> {
    const session: AuthSession = {
      ...mockSession,
      user: { ...mockUser, email },
      expiresAt: Date.now() + 86400000,
    };
    return apiClient.post(session);
  },

  async loginWithGoogle(): Promise<ApiResult<AuthSession>> {
    const session: AuthSession = {
      ...mockSession,
      user: {
        ...mockUser,
        email: 'alex.rivera.google@businessmind.ai',
        fullName: 'Alex Rivera (Google)',
      },
      expiresAt: Date.now() + 86400000,
    };
    return apiClient.post(session);
  },

  async logout(): Promise<ApiResult<{ success: boolean }>> {
    return apiClient.post({ success: true });
  },
};
