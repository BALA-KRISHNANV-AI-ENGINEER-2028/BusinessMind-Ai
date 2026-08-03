import type { ApiResult } from '../types/api';

/**
 * Base API Client Stub.
 *
 * Provides typed helper methods (get, post, put, delete) for services.
 * Currently simulates network latency and returns mock data responses in ApiResult format.
 * In Phase 4, the inner logic will be replaced with fetch or Axios calls to env.API_BASE_URL.
 */
class ApiClient {
  /** Simulates network latency for mock calls. */
  private async delay(ms = 200): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async get<T>(mockData: T, delayMs = 150): Promise<ApiResult<T>> {
    await this.delay(delayMs);
    return {
      data: mockData,
      success: true,
    };
  }

  public async post<T>(mockData: T, delayMs = 250): Promise<ApiResult<T>> {
    await this.delay(delayMs);
    return {
      data: mockData,
      success: true,
    };
  }

  public async put<T>(mockData: T, delayMs = 200): Promise<ApiResult<T>> {
    await this.delay(delayMs);
    return {
      data: mockData,
      success: true,
    };
  }

  public async delete<T>(mockData: T, delayMs = 150): Promise<ApiResult<T>> {
    await this.delay(delayMs);
    return {
      data: mockData,
      success: true,
    };
  }
}

export const apiClient = new ApiClient();
