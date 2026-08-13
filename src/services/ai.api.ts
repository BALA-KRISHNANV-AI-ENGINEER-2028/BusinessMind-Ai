/**
 * AI Query API Client — Phase 8: LLM Integration.
 *
 * Replaces the mock ai.service.ts functions with real HTTP calls to
 * POST /api/v1/ai/query.
 *
 * Features:
 *   - Calls the real backend endpoint (with mock fallback when server is offline)
 *   - Uses the shared apiClient for auth token injection and 401 refresh handling
 *   - Exports typed request/response shapes that match the backend contract
 */

import { apiClient } from './api.client';
import type { AiQueryRequest, AiQueryResponse } from '../types/ai-query';

// ─── Mock Fallback ────────────────────────────────────────────────────────────
// Used when the backend is offline (development without server running).

const MOCK_AI_RESPONSE: AiQueryResponse = {
  answer:
    "Based on the Q3 financial analysis, revenue grew by 35% quarter-over-quarter, driven primarily by enterprise subscription adoption [S1]. Operating expenses remained disciplined at $1.2M, resulting in improved margins across all business segments [S2].",
  citations: ['S1', 'S2'],
  confidence: 'high',
  limitations: [
    'Data covers Q3 only — Q4 results are not yet available in the connected knowledge base.',
  ],
  evidenceUsed: 2,
  sources: [
    {
      id: 'S1',
      documentId: 'doc-demo-1',
      documentVersionId: 'v1',
      documentName: 'Q3_Financial_Analysis.pdf',
      chunkId: 'chunk-demo-1',
      chunkIndex: 0,
      pageNumber: 2,
      sheetName: null,
      sectionHeading: 'Executive Summary',
      excerpt: 'Revenue grew by 35% quarter-over-quarter, driven by enterprise subscription adoption.',
      score: 0.894,
    },
    {
      id: 'S2',
      documentId: 'doc-demo-2',
      documentVersionId: 'v1',
      documentName: 'Enterprise_Product_Roadmap.docx',
      chunkId: 'chunk-demo-2',
      chunkIndex: 3,
      pageNumber: null,
      sheetName: null,
      sectionHeading: 'Phase 7 Architecture',
      excerpt: 'Operating expenses remained disciplined at $1.2M. R&D investments focused on RAG.',
      score: 0.781,
    },
  ],
  metadata: {
    model: 'mock-llm-v1',
    provider: 'mock',
    promptVersion: 'BUSINESS_RAG_SYSTEM_PROMPT_V1',
    retrievalTimeMs: 142,
    llmTimeMs: 310,
    totalTimeMs: 452,
    chunksRetrieved: 5,
    chunksInContext: 2,
    inputTokens: 850,
    outputTokens: 180,
  },
};

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Sends a business intelligence query to the AI backend.
 *
 * @param request - The query parameters.
 * @returns       - A grounded answer with cited sources.
 * @throws        - Error with user-facing message on failure.
 */
export async function queryAi(request: AiQueryRequest): Promise<AiQueryResponse> {
  const result = await apiClient.post<AiQueryResponse>(
    '/ai/query',
    request,
    MOCK_AI_RESPONSE,
  );
  if (!result.success) {
    throw new Error(result.message ?? 'AI query failed. Please try again.');
  }
  return result.data;
}
