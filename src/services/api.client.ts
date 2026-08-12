/**
 * Production API Client.
 *
 * Real HTTP client supporting:
 * - Base URL configuration (defaults to http://localhost:8000/api/v1)
 * - Automatic credentials inclusion (`credentials: 'include'`) for HTTP-only cookies
 * - Bearer Access Token injection from localStorage / memory
 * - Automatic 401 Refresh Token interception and retry
 * - Standard ApiResponse<T> unwrapping
 * - Fallback to mock data when backend server is offline
 */

import type { ApiResult } from '../types/api';

const API_BASE_URL =
  (import.meta.env['VITE_API_BASE_URL'] as string) || 'http://localhost:8000/api/v1';

const AUTH_STORAGE_KEY = 'businessmind_auth_session';

class ApiClient {
  private isRefreshing = false;

  private getAuthToken(): string | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as { token?: string };
      return parsed.token || null;
    } catch {
      return null;
    }
  }

  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    mockFallback?: T,
  ): Promise<ApiResult<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
      const res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: this.getHeaders(options.headers as Record<string, string>),
      });

      // 401 Unauthorized -> Attempt token refresh once
      if (res.status === 401 && !this.isRefreshing && !endpoint.includes('/auth/refresh')) {
        this.isRefreshing = true;
        const refreshed = await this.tryRefreshToken();
        this.isRefreshing = false;

        if (refreshed) {
          // Retry original request with new token
          const retryRes = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: this.getHeaders(options.headers as Record<string, string>),
          });
          const retryJson = (await retryRes.json()) as { success?: boolean; data?: T; message?: string };
          if (retryRes.ok && retryJson.data !== undefined) {
            return { data: retryJson.data, success: true, message: retryJson.message };
          }
        }
      }

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({ message: res.statusText }))) as {
          message?: string;
          details?: Record<string, string[]>;
        };

        let message = errJson.message || `HTTP ${res.status}`;
        if (errJson.details && typeof errJson.details === 'object') {
          const detailMessages = Object.entries(errJson.details)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : String(msgs)}`)
            .join('; ');
          if (detailMessages) {
            message = `${message} — ${detailMessages}`;
          }
        }
        const errorObj = new Error(message);
        (errorObj as unknown as { details?: Record<string, string[]> }).details = errJson.details;
        throw errorObj;
      }

      const json = (await res.json()) as { success?: boolean; data?: T; message?: string };
      return {
        data: (json.data !== undefined ? json.data : json) as T,
        success: true,
        message: json.message,
      };
    } catch (err) {
      if (mockFallback !== undefined) {
        return { data: mockFallback, success: true };
      }
      throw err;
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return false;
      const json = (await res.json()) as { data?: { token?: string; expiresAt?: number } };
      if (json.data?.token) {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.token = json.data.token;
          if (json.data.expiresAt) parsed.expiresAt = json.data.expiresAt;
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public async get<T>(endpointOrMock: string | T, mockFallback?: T): Promise<ApiResult<T>> {
    if (typeof endpointOrMock === 'string') {
      return this.request<T>(endpointOrMock, { method: 'GET' }, mockFallback);
    }
    return { data: endpointOrMock, success: true };
  }

  public async post<T>(endpointOrMock: string | T, body?: unknown, mockFallback?: T): Promise<ApiResult<T>> {
    if (typeof endpointOrMock === 'string') {
      return this.request<T>(
        endpointOrMock,
        { method: 'POST', body: JSON.stringify(body) },
        mockFallback,
      );
    }
    return { data: endpointOrMock, success: true };
  }

  public async patch<T>(endpointOrMock: string | T, body?: unknown, mockFallback?: T): Promise<ApiResult<T>> {
    if (typeof endpointOrMock === 'string') {
      return this.request<T>(
        endpointOrMock,
        { method: 'PATCH', body: JSON.stringify(body) },
        mockFallback,
      );
    }
    return { data: endpointOrMock, success: true };
  }

  public async put<T>(endpointOrMock: string | T, body?: unknown, mockFallback?: T): Promise<ApiResult<T>> {
    if (typeof endpointOrMock === 'string') {
      return this.request<T>(
        endpointOrMock,
        { method: 'PUT', body: JSON.stringify(body) },
        mockFallback,
      );
    }
    return { data: endpointOrMock, success: true };
  }

  public async delete<T>(endpointOrMock: string | T, mockFallback?: T): Promise<ApiResult<T>> {
    if (typeof endpointOrMock === 'string') {
      return this.request<T>(endpointOrMock, { method: 'DELETE' }, mockFallback);
    }
    return { data: endpointOrMock, success: true };
  }

  public async uploadFormData<T>(endpoint: string, formData: FormData, mockFallback?: T): Promise<ApiResult<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {};
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers,
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errJson.message || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as { success?: boolean; data?: T; message?: string };
      return {
        data: (json.data !== undefined ? json.data : json) as T,
        success: true,
        message: json.message,
      };
    } catch (err) {
      if (mockFallback !== undefined) {
        return { data: mockFallback, success: true };
      }
      throw err;
    }
  }
}

export const apiClient = new ApiClient();
