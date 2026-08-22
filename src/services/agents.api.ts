/**
 * Agents API Client — Phase 9: Specialized Agentic AI Foundation.
 *
 * Provides API functions for interacting with backend AI agents.
 * Connects to `POST /api/v1/agents/:agentId/analyze` and `GET /api/v1/agents`.
 *
 * Features:
 *   - Calls real backend endpoints with mock fallbacks for offline dev
 *   - Uses apiClient for JWT injection and 401 refresh handling
 */

import { apiClient } from './api.client';
import type { AgentResult, AgentListItem, AnalyzeAgentRequest } from '../types/agents';

// ─── Mock Fallback Data ───────────────────────────────────────────────────────

const MOCK_SALES_AGENT_RESULT: AgentResult = {
  agentId: 'sales',
  agentVersion: '1.0.0',
  requestId: 'mock-req-sales-101',
  summary:
    'Q4 sales revenue declined by 12% quarter-over-quarter, driven primarily by lower enterprise order volumes [S1]. Retail segment sales remained stable with modest 1% growth [S2].',
  findings: [
    {
      finding: 'Q4 sales revenue decreased by 12% quarter-over-quarter.',
      type: 'fact',
      citations: ['S1'],
    },
    {
      finding: 'Enterprise tier subscription renewals dropped by 18% in Q4.',
      type: 'fact',
      citations: ['S1'],
    },
    {
      finding: 'Retail segment sales increased slightly by 1.2%.',
      type: 'fact',
      citations: ['S2'],
    },
    {
      finding: 'The enterprise decline appears associated with delayed software procurement cycles in European markets.',
      type: 'inference',
      citations: ['S1', 'S2'],
    },
  ],
  evidence: [
    {
      id: 'S1',
      documentId: 'doc-sales-q4-1',
      documentVersionId: 'v1',
      documentName: 'Q4_2025_Sales_Performance_Report.pdf',
      chunkId: 'chunk-s1',
      chunkIndex: 2,
      pageNumber: 5,
      sheetName: null,
      sectionHeading: 'Enterprise Revenue Breakdown',
      excerpt: 'Q4 sales revenue decreased by 12% quarter-over-quarter, driven by enterprise subscription renewals dropping 18%.',
      score: 0.892,
    },
    {
      id: 'S2',
      documentId: 'doc-retail-q4-2',
      documentVersionId: 'v1',
      documentName: 'Q4_Channel_Distribution_Summary.xlsx',
      chunkId: 'chunk-s2',
      chunkIndex: 0,
      pageNumber: null,
      sheetName: 'Retail Channels',
      sectionHeading: 'Channel Growth',
      excerpt: 'Retail segment sales increased by 1.2% in Q4, maintaining consistent baseline performance across domestic regions.',
      score: 0.815,
    },
  ],
  confidence: 'high',
  limitations: [
    'Analysis is restricted to Q4 2025 data currently uploaded in the connected knowledge base.',
    'Competitor pricing and macroeconomic context were not available in the retrieved documents.',
  ],
  risks: [
    {
      risk: 'Enterprise churn trend may spill into Q1 2026 if procurement delays persist.',
      severity: 'high',
    },
  ],
  metadata: {
    agentId: 'sales',
    agentVersion: '1.0.0',
    requestId: 'mock-req-sales-101',
    retrievalTimeMs: 125,
    llmTimeMs: 410,
    totalTimeMs: 535,
    evidenceCount: 8,
    chunksInContext: 2,
    model: 'mock-llm-v1',
    provider: 'mock',
    promptVersion: 'SALES_AGENT_SYSTEM_PROMPT_V1',
    inputTokens: 1120,
    outputTokens: 340,
  },
};

const MOCK_AGENTS_LIST: AgentListItem[] = [
  {
    id: 'sales',
    name: 'Sales Intelligence Agent',
    description:
      'Analyzes sales performance, revenue trends, period comparisons, regional breakdowns, and sales anomalies grounded in enterprise documents.',
    version: '1.0.0',
    capabilities: [
      'sales-analysis',
      'sales-trends',
      'revenue-analysis',
      'period-comparison',
      'product-performance',
      'regional-performance',
    ],
  },
];

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Sends a query to a specialized AI agent for analysis.
 *
 * @param request - Agent ID, natural language query, and optional knowledge base ID.
 * @returns       - Grounded agent result with structured findings.
 */
export async function analyzeWithAgent(request: AnalyzeAgentRequest): Promise<AgentResult> {
  const result = await apiClient.post<AgentResult>(
    `/agents/${encodeURIComponent(request.agentId)}/analyze`,
    {
      query: request.query,
      knowledgeBaseId: request.knowledgeBaseId,
    },
    MOCK_SALES_AGENT_RESULT,
  );

  if (!result.success) {
    throw new Error(result.message ?? `Agent analysis failed. Please try again.`);
  }

  return result.data;
}

/**
 * Lists all registered AI agents available in the system.
 */
export async function fetchAgents(): Promise<AgentListItem[]> {
  const result = await apiClient.get<AgentListItem[]>('/agents', MOCK_AGENTS_LIST);
  if (!result.success) {
    throw new Error(result.message ?? 'Failed to load agents.');
  }
  return result.data;
}
