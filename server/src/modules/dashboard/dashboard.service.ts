import { recommendationsRepository } from '../recommendations/recommendations.repository';
import { decisionRepository } from '../../repositories/decision.repository';
import { documentRepository } from '../../repositories/document.repository';
import { agentExecutionRepository } from '../../repositories/agent-execution.repository';
import { decisionsService } from '../decisions/decisions.service';

export interface MetricDto {
  id: string;
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  tone?: 'positive' | 'negative' | 'neutral';
}

export interface AgentStatusInfoDto {
  id: string;
  name: string;
  description: string;
  state: 'running' | 'idle' | 'error';
  lastRunLabel: string;
}

const REGISTERED_AGENTS = [
  {
    id: 'sales',
    name: 'Sales Intelligence Agent',
    description: 'Monitors deal velocity, pipeline bottlenecks, and win rates',
  },
  {
    id: 'finance',
    name: 'Financial Analyst Agent',
    description: 'Audits cost variances, cashflow runaways, and margin shifts',
  },
  {
    id: 'customer',
    name: 'Customer Experience Agent',
    description: 'Tracks sentiment drifts, renewal risks, and churn flags',
  },
  {
    id: 'inventory',
    name: 'Supply Chain Agent',
    description: 'Identifies inventory aging, stockout probabilities, and lead-time risks',
  },
  {
    id: 'market',
    name: 'Market Intelligence Agent',
    description: 'Surfaces competitive moves and regulatory compliance changes',
  },
  {
    id: 'risk',
    name: 'Governance & Risk Agent',
    description: 'Evaluates policy conformity and contractual liability exposure',
  },
];

export class DashboardService {
  async getMetrics(organizationId: string): Promise<MetricDto[]> {
    const [recs, openRisks, docsCount, decisionsCount] = await Promise.all([
      recommendationsRepository.count({ organizationId, status: 'active', deletedAt: null }),
      recommendationsRepository.count({
        organizationId,
        status: 'active',
        riskLevel: { $in: ['medium', 'high'] },
        deletedAt: null,
      }),
      documentRepository.count({ organizationId, deletedAt: null }),
      decisionRepository.count({ organizationId, deletedAt: null }),
    ]);

    return [
      {
        id: 'active_recommendations',
        label: 'Active Recommendations',
        value: recs.toString(),
        delta: recs > 0 ? `${recs} active insights` : 'No active recommendations',
        trend: recs > 0 ? 'up' : 'flat',
        tone: 'neutral',
      },
      {
        id: 'open_risks',
        label: 'Open Risk Factors',
        value: openRisks.toString(),
        delta: openRisks > 0 ? `${openRisks} require review` : 'Clean exposure profile',
        trend: openRisks > 0 ? 'up' : 'down',
        tone: openRisks > 0 ? 'negative' : 'positive',
      },
      {
        id: 'documents_analyzed',
        label: 'Knowledge Documents',
        value: docsCount.toString(),
        delta: docsCount > 0 ? `${docsCount} indexed files` : 'No documents uploaded',
        trend: docsCount > 0 ? 'up' : 'flat',
        tone: 'neutral',
      },
      {
        id: 'logged_decisions',
        label: 'Decisions Tracked',
        value: decisionsCount.toString(),
        delta: decisionsCount > 0 ? `${decisionsCount} recorded` : '0 logged decisions',
        trend: 'flat',
        tone: 'neutral',
      },
    ];
  }

  async getAgentStatuses(organizationId: string): Promise<AgentStatusInfoDto[]> {
    const results: AgentStatusInfoDto[] = [];

    for (const agent of REGISTERED_AGENTS) {
      const latest = await agentExecutionRepository.findLatestByAgent(organizationId, agent.id);

      let state: 'running' | 'idle' | 'error' = 'idle';
      let lastRunLabel = 'Never run';

      if (latest) {
        if (latest.status === 'running') state = 'running';
        else if (latest.status === 'failed') state = 'error';
        else state = 'idle';

        const diffMs = Date.now() - new Date(latest.createdAt).getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) lastRunLabel = 'Just now';
        else if (mins < 60) lastRunLabel = `${mins}m ago`;
        else {
          const hours = Math.floor(mins / 60);
          if (hours < 24) lastRunLabel = `${hours}h ago`;
          else lastRunLabel = new Date(latest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      }

      results.push({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        state,
        lastRunLabel,
      });
    }

    return results;
  }

  async getRecentDecisions(organizationId: string) {
    return decisionsService.getRecent(organizationId, 5);
  }

  async getDashboardRecommendations(organizationId: string) {
    const recs = await recommendationsRepository.findByOrganization(organizationId, {
      status: 'active',
      limit: 4,
    });
    return recs.map((r) => ({
      id: r.id,
      title: r.title,
      summary: r.summary,
      confidence: r.confidence,
      riskLevel: r.riskLevel,
      category: r.category,
    }));
  }

  async getRecentDocuments(organizationId: string) {
    const result = await documentRepository.findAll(
      { organizationId, deletedAt: null },
      { page: 1, pageSize: 5 },
    );
    return result.data.map((doc: any) => ({
      id: doc.id,
      name: doc.name || doc.title || 'Untitled Document',
      updatedLabel: new Date(doc.updatedAt || doc.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      fileType: doc.mimeType?.split('/')[1]?.toUpperCase() || doc.fileType || 'PDF',
      status: doc.status || 'processed',
      sizeLabel: doc.sizeBytes ? `${Math.round(doc.sizeBytes / 1024)} KB` : undefined,
    }));
  }
}

export const dashboardService = new DashboardService();
