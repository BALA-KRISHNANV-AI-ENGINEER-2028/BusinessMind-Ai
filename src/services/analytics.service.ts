import { apiClient } from './api.client';
import type { ApiResult } from '../types/api';
import type { Metric } from '../types/business';
import { analyticsMetrics, weeklyDecisionVolume, analyticsTableRows } from '../mocks/analytics.mock';
import type { AnalyticsRow, DecisionVolume } from '../mocks/analytics.mock';

export const analyticsService = {
  async getMetrics(): Promise<ApiResult<Metric[]>> {
    return apiClient.get(analyticsMetrics);
  },

  async getDecisionVolume(): Promise<ApiResult<DecisionVolume[]>> {
    return apiClient.get(weeklyDecisionVolume);
  },

  async getTableRows(): Promise<ApiResult<AnalyticsRow[]>> {
    return apiClient.get(analyticsTableRows);
  },
};
