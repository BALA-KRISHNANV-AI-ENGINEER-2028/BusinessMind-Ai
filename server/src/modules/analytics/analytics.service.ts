import { decisionRepository } from '../../repositories/decision.repository';
import { recommendationsRepository } from '../recommendations/recommendations.repository';
import { documentRepository } from '../../repositories/document.repository';
import type { Metric, AnalyticsDashboardData } from './analytics.types';

export interface FrontendDecisionVolume {
  label: string;
  value: number;
}

export interface AnalyticsRow {
  id: string;
  metric: string;
  thisPeriod: string;
  lastPeriod: string;
  change: string;
}

export class AnalyticsService {
  async getDashboardMetrics(orgId: string): Promise<AnalyticsDashboardData> {
    const metrics = await this.getMetrics(orgId);
    return {
      metrics,
      decisionVolume: [],
    };
  }

  async getMetrics(orgId: string): Promise<Metric[]> {
    const [decisions, recs, docs] = await Promise.all([
      decisionRepository.findByOrganization(orgId),
      recommendationsRepository.findByOrganization(orgId),
      documentRepository.findAll({ organizationId: orgId, deletedAt: null }, { page: 1, pageSize: 100 }),
    ]);

    const decisionsCount = decisions.length;
    const recsCount = recs.length;
    const docsCount = docs.data.length;

    const avgConfidence =
      recsCount > 0
        ? Math.round(recs.reduce((acc, r) => acc + (r.confidence || 0), 0) / recsCount)
        : 0;

    return [
      {
        id: 'decisions',
        label: 'Decisions Logged',
        value: decisionsCount.toString(),
        delta: decisionsCount > 0 ? `${decisionsCount} recorded` : '0 logged',
        trend: 'up',
        tone: 'positive',
      },
      {
        id: 'avg-confidence',
        label: 'Avg. Recommendation Confidence',
        value: avgConfidence > 0 ? `${avgConfidence}%` : 'N/A',
        delta: avgConfidence > 0 ? 'AI model grounded' : 'Generate recommendations to compute',
        trend: avgConfidence > 0 ? 'up' : 'flat',
        tone: avgConfidence > 75 ? 'positive' : 'neutral',
      },
      {
        id: 'recommendations',
        label: 'Total Recommendations',
        value: recsCount.toString(),
        delta: recsCount > 0 ? `${recsCount} generated` : '0 generated',
        trend: recsCount > 0 ? 'up' : 'flat',
        tone: 'positive',
      },
      {
        id: 'documents',
        label: 'Indexed Documents',
        value: docsCount.toString(),
        delta: docsCount > 0 ? `${docsCount} in knowledge base` : '0 files',
        trend: docsCount > 0 ? 'up' : 'flat',
        tone: 'neutral',
      },
    ];
  }

  async getDecisionVolume(orgId: string): Promise<FrontendDecisionVolume[]> {
    const decisions = await decisionRepository.findByOrganization(orgId);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts: Record<string, number> = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };

    for (const d of decisions) {
      const dayName = days[new Date(d.createdAt).getDay()];
      if (counts[dayName] !== undefined) {
        counts[dayName]++;
      }
    }

    return [
      { label: 'Mon', value: counts['Mon'] },
      { label: 'Tue', value: counts['Tue'] },
      { label: 'Wed', value: counts['Wed'] },
      { label: 'Thu', value: counts['Thu'] },
      { label: 'Fri', value: counts['Fri'] },
      { label: 'Sat', value: counts['Sat'] },
      { label: 'Sun', value: counts['Sun'] },
    ];
  }

  async getTableRows(orgId: string): Promise<AnalyticsRow[]> {
    const [decisions, recs, docs] = await Promise.all([
      decisionRepository.findByOrganization(orgId),
      recommendationsRepository.findByOrganization(orgId),
      documentRepository.findAll({ organizationId: orgId, deletedAt: null }, { page: 1, pageSize: 100 }),
    ]);

    const decisionsCount = decisions.length;
    const recsCount = recs.length;
    const docsCount = docs.data.length;

    const avgConfidence =
      recsCount > 0
        ? Math.round(recs.reduce((acc, r) => acc + (r.confidence || 0), 0) / recsCount)
        : 0;

    return [
      {
        id: '1',
        metric: 'Decisions Logged',
        thisPeriod: decisionsCount.toString(),
        lastPeriod: '0',
        change: decisionsCount > 0 ? `+${decisionsCount}` : '0',
      },
      {
        id: '2',
        metric: 'New recommendations',
        thisPeriod: recsCount.toString(),
        lastPeriod: '0',
        change: recsCount > 0 ? `+${recsCount}` : '0',
      },
      {
        id: '3',
        metric: 'Documents processed',
        thisPeriod: docsCount.toString(),
        lastPeriod: '0',
        change: docsCount > 0 ? `+${docsCount}` : '0',
      },
      {
        id: '4',
        metric: 'Avg. Recommendation Confidence',
        thisPeriod: avgConfidence > 0 ? `${avgConfidence}%` : 'N/A',
        lastPeriod: 'N/A',
        change: avgConfidence > 0 ? `+${avgConfidence}%` : '0%',
      },
    ];
  }
}

export const analyticsService = new AnalyticsService();
