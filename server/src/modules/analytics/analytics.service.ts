/** Analytics Service — Placeholder. Phase 5: Implementation. */
import { AppError } from '../../errors/AppError';
import { HttpStatus } from '../../constants/http.constants';
import type { IAnalyticsService } from './analytics.interface';
import type { AnalyticsDashboardData } from './analytics.types';

const stub = (m: string) => new AppError(`AnalyticsService.${m} not implemented (Phase 5).`, HttpStatus.NOT_IMPLEMENTED, 'NOT_IMPLEMENTED', true);

export class AnalyticsService implements IAnalyticsService {
  async getDashboardMetrics(_orgId: string): Promise<AnalyticsDashboardData> { throw stub('getDashboardMetrics'); }
}
export const analyticsService = new AnalyticsService();
