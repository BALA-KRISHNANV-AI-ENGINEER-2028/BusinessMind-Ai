/**
 * AI Module — Types.
 *
 * Phase 8: LLM Integration.
 * Replaces the Phase 6+ stub types with concrete, production-ready shapes.
 *
 * These types define the API contract for POST /api/v1/ai/query.
 */

// ─── Request ──────────────────────────────────────────────────────────────────

/**
 * Input DTO for an AI business intelligence query.
 *
 * Security note:
 *   organizationId and userId are NEVER trusted from the client.
 *   They are always sourced from the verified JWT (req.user) in the controller.
 */
export interface AiQueryDto {
  /** The user's natural-language business question. */
  query: string;
  /**
   * Optional: restrict retrieval to a specific Knowledge Base.
   * If omitted, searches across all Knowledge Bases in the organization.
   * The backend validates ownership before retrieval.
   */
  knowledgeBaseId?: string;
  /**
   * Optional: number of evidence chunks to retrieve.
   * Default: config.rag.retrievalTopK (5). Max: 10.
   */
  topK?: number;

  // Injected server-side from authenticated JWT — never from client body
  organizationId: string;
  userId: string;
}

// ─── Response ─────────────────────────────────────────────────────────────────

/**
 * A fully-resolved evidence source for display in the Sources panel.
 */
export interface AiSourceReference {
  /** Citation label used inline in the answer: "S1", "S2", etc. */
  id: string;
  documentId: string;
  documentVersionId: string;
  documentName: string;
  chunkId: string;
  chunkIndex: number;
  /** Page number (PDF only, null otherwise). */
  pageNumber: number | null;
  /** Sheet name (XLSX only, null otherwise). */
  sheetName: string | null;
  /** Section heading if detected. */
  sectionHeading: string | null;
  /** Short excerpt of the source chunk for inline preview. */
  excerpt: string;
  /** Cosine similarity score (0–1). */
  score: number;
}

/** Confidence levels matching the LLM output schema. */
export type AiConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient';

/**
 * Metadata about the AI request for observability and debugging.
 * Not sensitive — safe to return in the API response.
 */
export interface AiQueryMetadata {
  /** LLM model used for generation. */
  model: string;
  /** LLM provider used. */
  provider: string;
  /** Prompt template version. */
  promptVersion: string;
  /** Time taken for vector retrieval (ms). */
  retrievalTimeMs: number;
  /** Time taken for the LLM response (ms). */
  llmTimeMs: number;
  /** Total end-to-end time (ms). */
  totalTimeMs: number;
  /** Number of chunks retrieved from vector search. */
  chunksRetrieved: number;
  /** Number of chunks actually included in the LLM context. */
  chunksInContext: number;
  /** Approximate input token usage (if reported by provider). */
  inputTokens?: number;
  /** Approximate output token usage (if reported by provider). */
  outputTokens?: number;
}

/**
 * The structured response returned by POST /api/v1/ai/query.
 *
 * Wrapped in the standard { success: true, data: AiQueryResult } envelope
 * by sendSuccess() in the controller.
 */
export interface AiQueryResult {
  /** The grounded answer text with inline citations (e.g., "[S1][S2]"). */
  answer: string;
  /**
   * Citation IDs referenced in the answer.
   * Each ID maps to an entry in sources[].
   */
  citations: string[];
  /** Confidence level of the response. */
  confidence: AiConfidenceLevel;
  /**
   * Known gaps or caveats in the evidence.
   * E.g., "No competitor data was found."
   */
  limitations: string[];
  /** Number of evidence sources used to generate the answer. */
  evidenceUsed: number;
  /**
   * Resolved source references.
   * Ordered to match citations[].
   */
  sources: AiSourceReference[];
  /** Observability metadata. */
  metadata: AiQueryMetadata;
}

// ─── Agent Status (legacy stub — kept for route compatibility) ─────────────────

export type AgentState = 'running' | 'idle' | 'error';

export interface AgentStatus {
  id: string;
  name: string;
  description: string;
  state: AgentState;
  lastRunAt?: string;
  organizationId: string;
}
