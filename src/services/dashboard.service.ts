import { apiClient } from './api.client';
import type { ApiResult } from '../types/api';
import type { Metric, AgentStatusInfo, Decision, Recommendation, DocumentSummary } from '../types/business';
import {
  dashboardMetrics,
  agentStatuses,
  recentDecisions,
  dashboardRecommendations,
  recentDocuments,
} from '../mocks/dashboard.mock';

export const dashboardService = {
  async getMetrics(): Promise<ApiResult<Metric[]>> {
    return apiClient.get(dashboardMetrics);
  },

  async getAgentStatuses(): Promise<ApiResult<AgentStatusInfo[]>> {
    return apiClient.get(agentStatuses);
  },

  async getRecentDecisions(): Promise<ApiResult<Decision[]>> {
    return apiClient.get(recentDecisions);
  },

  async getDashboardRecommendations(): Promise<ApiResult<Recommendation[]>> {
    return apiClient.get(dashboardRecommendations);
  },

  async getRecentDocuments(): Promise<ApiResult<DocumentSummary[]>> {
    return apiClient.get(recentDocuments);
  },
};
