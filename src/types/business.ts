export type TrendDirection = 'up' | 'down' | 'flat';

export interface Metric {
  id: string;
  label: string;
  value: string;
  delta?: string;
  trend?: TrendDirection;
  /** Overrides the default neutral tone, e.g. a metric where "down" is good. */
  tone?: 'positive' | 'negative' | 'neutral';
}

export type AgentState = 'running' | 'idle' | 'error';

export interface AgentStatusInfo {
  id: string;
  name: string;
  description: string;
  state: AgentState;
  lastRunLabel: string;
}

export type DecisionOutcome = 'approved' | 'rejected' | 'pending';

export interface Decision {
  id: string;
  title: string;
  dateLabel: string;
  owner: string;
  outcome: DecisionOutcome;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface Recommendation {
  id: string;
  title: string;
  summary: string;
  confidence: number; // 0-100
  riskLevel: RiskLevel;
  category: string;
}

export type DocumentStatus = 'processed' | 'processing' | 'failed';

export interface DocumentSummary {
  id: string;
  name: string;
  updatedLabel: string;
  fileType: string;
  status?: DocumentStatus;
  sizeLabel?: string;
  uploadedBy?: string;
  category?: string;
  tags?: string[];
}
