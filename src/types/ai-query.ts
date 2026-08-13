/**
 * AI Query API Types — Phase 8: LLM Integration.
 *
 * Frontend type definitions for the POST /api/v1/ai/query endpoint.
 * These mirror the server-side AiQueryResult type exactly.
 */

// ─── Response Types ───────────────────────────────────────────────────────────

export type AiConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient';

/**
 * A resolved evidence source displayed in the Sources panel.
 * [S1], [S2] labels link to these entries.
 */
export interface AiSourceReference {
  /** Citation label: "S1", "S2", etc. */
  id: string;
  documentId: string;
  documentVersionId: string;
  documentName: string;
  chunkId: string;
  chunkIndex: number;
  /** Page number (PDF only). null for other document types. */
  pageNumber: number | null;
  /** Sheet name (XLSX only). null for other document types. */
  sheetName: string | null;
  /** Detected section heading, if any. */
  sectionHeading: string | null;
  /** Short excerpt from the source chunk. */
  excerpt: string;
  /** Relevance score (0–1) from vector search. */
  score: number;
}

/** Performance and observability metadata for the AI query. */
export interface AiQueryMetadata {
  model: string;
  provider: string;
  promptVersion: string;
  retrievalTimeMs: number;
  llmTimeMs: number;
  totalTimeMs: number;
  chunksRetrieved: number;
  chunksInContext: number;
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * The full response from POST /api/v1/ai/query.
 */
export interface AiQueryResponse {
  /** Grounded answer with inline citation labels like [S1], [S2]. */
  answer: string;
  /** Citation IDs referenced in the answer. Each maps to an entry in sources[]. */
  citations: string[];
  /** Confidence level of the response. */
  confidence: AiConfidenceLevel;
  /** Known gaps or caveats identified by the LLM. */
  limitations: string[];
  /** Number of evidence sources used. */
  evidenceUsed: number;
  /** Fully resolved evidence source references. */
  sources: AiSourceReference[];
  /** Observability metadata. */
  metadata: AiQueryMetadata;
}

// ─── Request Types ────────────────────────────────────────────────────────────

export interface AiQueryRequest {
  /** The natural-language business question. */
  query: string;
  /** Optional: restrict to a specific Knowledge Base. */
  knowledgeBaseId?: string;
  /** Optional: number of evidence chunks (1–10, default: 5). */
  topK?: number;
}
