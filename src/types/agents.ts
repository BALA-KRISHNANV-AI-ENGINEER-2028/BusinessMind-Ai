/**
 * Agent API Types — Phase 9: Specialized Agentic AI Foundation.
 *
 * Types for frontend agent client requests and responses.
 * Matches backend `AgentResult` and `AgentListItem`.
 */

import type { AiConfidenceLevel as ConfidenceLevel, AiSourceReference as ResolvedSource } from './ai-query';

export interface AgentFinding {
  finding: string;
  type: 'fact' | 'inference';
  citations: string[];
}

export interface AgentRisk {
  risk: string;
  severity: 'high' | 'medium' | 'low';
}

export interface AgentExecutionMetadata {
  agentId: string;
  agentVersion: string;
  requestId: string;
  retrievalTimeMs: number;
  llmTimeMs: number;
  totalTimeMs: number;
  evidenceCount: number;
  chunksInContext: number;
  model: string;
  provider: string;
  promptVersion: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface AgentResult {
  agentId: string;
  agentVersion: string;
  requestId: string;
  summary: string;
  findings: AgentFinding[];
  evidence: ResolvedSource[];
  confidence: ConfidenceLevel;
  limitations: string[];
  risks?: AgentRisk[];
  metadata: AgentExecutionMetadata;
}

export interface AgentListItem {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: string[];
}

export interface AnalyzeAgentRequest {
  agentId: string;
  query: string;
  knowledgeBaseId?: string;
}
