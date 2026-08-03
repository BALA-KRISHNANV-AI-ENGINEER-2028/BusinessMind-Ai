import type { Metric, AgentStatusInfo, Decision, Recommendation, DocumentSummary } from '../types/business';

export const dashboardMetrics: Metric[] = [
  { id: 'health', label: 'Business Health', value: '87', delta: '+4 pts', trend: 'up', tone: 'positive' },
  { id: 'recommendations', label: 'Active Recommendations', value: '12', delta: '+3', trend: 'up', tone: 'positive' },
  { id: 'risks', label: 'Open Risks', value: '7', delta: '+2', trend: 'up', tone: 'negative' },
  { id: 'documents', label: 'Documents Processed', value: '184', delta: '+21', trend: 'up', tone: 'positive' },
];

export const agentStatuses: AgentStatusInfo[] = [
  {
    id: 'market-scan',
    name: 'Market Scan Agent',
    description: 'Monitors competitor pricing and market shifts',
    state: 'running',
    lastRunLabel: 'Running now',
  },
  {
    id: 'risk-monitor',
    name: 'Risk Monitor Agent',
    description: 'Flags financial and operational risk signals',
    state: 'idle',
    lastRunLabel: 'Last run 2 hours ago',
  },
  {
    id: 'doc-ingest',
    name: 'Document Ingestion Agent',
    description: 'Parses and indexes newly uploaded documents',
    state: 'error',
    lastRunLabel: 'Failed 14 minutes ago',
  },
];

export const recentDecisions: Decision[] = [
  { id: '1', title: 'Approve Q3 vendor contract renewal', dateLabel: 'Today, 9:41 AM', owner: 'S. Martins', outcome: 'approved' },
  { id: '2', title: 'Expand into APAC region', dateLabel: 'Yesterday', owner: 'D. Chen', outcome: 'pending' },
  { id: '3', title: 'Reduce marketing spend by 10%', dateLabel: '2 days ago', owner: 'A. Osei', outcome: 'rejected' },
  { id: '4', title: 'Migrate billing to new provider', dateLabel: '3 days ago', owner: 'S. Martins', outcome: 'approved' },
];

export const dashboardRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Renegotiate cloud infrastructure contract',
    summary: 'Current usage patterns suggest a 15% cost reduction is achievable with a multi-year commitment.',
    confidence: 82,
    riskLevel: 'low',
    category: 'Cost optimization',
  },
  {
    id: '2',
    title: 'Delay APAC expansion by one quarter',
    summary: 'Regulatory approval timelines in target markets are running longer than initially projected.',
    confidence: 68,
    riskLevel: 'medium',
    category: 'Market strategy',
  },
];

export const recentDocuments: DocumentSummary[] = [
  { id: '1', name: 'Q3-vendor-contract.pdf', updatedLabel: '2 hours ago', fileType: 'pdf' },
  { id: '2', name: 'apac-market-analysis.docx', updatedLabel: '5 hours ago', fileType: 'docx' },
  { id: '3', name: 'marketing-spend-report.xlsx', updatedLabel: 'Yesterday', fileType: 'xlsx' },
];
