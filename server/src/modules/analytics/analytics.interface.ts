/** Analytics Module — Interface. */
import type { AnalyticsDashboardData } from './analytics.types';

export interface IAnalyticsService {
  getDashboardMetrics(orgId: string): Promise<AnalyticsDashboardData>;
  // Phase 6+: getUsageStats, exportReport
}
