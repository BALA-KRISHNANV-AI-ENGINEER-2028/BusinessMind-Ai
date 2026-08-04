/**
 * AI Module — Types.
 * Prepared for LLM + RAG + Agentic AI integration in Phase 6+.
 */

import type { ISODateString } from '../../types/common.types';

export type AgentState = 'running' | 'idle' | 'error';

export interface AgentStatus {
  id: string;
  name: string;
  description: string;
  state: AgentState;
  lastRunAt?: ISODateString;
  organizationId: string;
}

export interface AiQueryDto {
  query: string;
  threadId?: string;
  organizationId: string;
  // Phase 6+: context, temperature, maxTokens, retrievalConfig
}

export interface AiQueryResult {
  answer: string;
  confidence: number;
  sources: Array<{ documentId: string; snippet: string }>;
  threadId: string;
  // Phase 6+: structuredResponse, reasoning, agentTrace
}
