import { apiClient } from './api.client';
import type { ApiResult } from '../types/api';
import type { Recommendation } from '../types/business';
import { allRecommendations } from '../mocks/recommendations.mock';

export const recommendationsService = {
  async getRecommendations(): Promise<ApiResult<Recommendation[]>> {
    return apiClient.get(allRecommendations);
  },

  async dismissRecommendation(id: string): Promise<ApiResult<{ id: string }>> {
    return apiClient.post({ id });
  },
};
