/**
 * Analytics Module — Types.
 * Mirrors frontend Metric, TrendDirection types.
 */

import type { ISODateString } from '../../types/common.types';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface Metric {
  id: string;
  label: string;
  value: string;
  delta?: string;
  trend?: TrendDirection;
  tone?: 'positive' | 'negative' | 'neutral';
}

export interface DecisionVolume {
  date: ISODateString;
  approved: number;
  rejected: number;
  pending: number;
}

export interface AnalyticsDashboardData {
  metrics: Metric[];
  decisionVolume: DecisionVolume[];
  // Phase 6+: aiUsageStats, documentProcessingStats, agentPerformance
}
