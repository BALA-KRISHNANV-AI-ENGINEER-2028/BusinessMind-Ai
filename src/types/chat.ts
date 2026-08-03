import type { Recommendation, RiskLevel } from './business';

export interface EvidenceItem {
  id: string;
  source: string;
  snippet: string;
}

export interface RiskItem {
  id: string;
  title: string;
  level: RiskLevel;
  description: string;
}

export interface StructuredResponse {
  summary: string;
  evidence: EvidenceItem[];
  confidence: number; // 0-100
  risks: RiskItem[];
  recommendations: Recommendation[];
  actionPlan: string[];
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestampLabel: string;
  structured?: StructuredResponse;
}

export interface ChatThread {
  id: string;
  title: string;
  previewLabel: string;
  timestampLabel: string;
  isActive?: boolean;
}
