/**
 * Agent Module — Types.
 *
 * Phase 9: Specialized Agentic AI Foundation.
 *
 * Defines all shared type contracts for the agent layer.
 * These types are intentionally decoupled from any specific agent implementation
 * so the registry, controller, and tests never import from individual agents.
 */

import type { ConfidenceLevel } from '../../services/ai/response.validator';
import type { ResolvedSource } from '../../services/ai/citation.mapper';

// Re-export for downstream consumers of this module
export type { ConfidenceLevel };

// ─── Agent Request ─────────────────────────────────────────────────────────────

/**
 * Inbound request to an agent after authentication and authorization.
 *
 * Security note:
 *   organizationId and userId are ALWAYS sourced from the verified JWT (req.user).
 *   They are NEVER trusted from the request body.
 *   knowledgeBaseId ownership is validated by AgentExecutionService before execution.
 */
export interface AgentRequest {
  /** Which agent to invoke. Matched against AgentRegistry. */
  agentId: string;

  /** The user's natural-language business question. */
  query: string;

  /**
   * Optional: restrict retrieval to a specific Knowledge Base.
   * Ownership is validated server-side before execution.
   */
  knowledgeBaseId?: string;

  /** Injected from verified JWT — never trusted from client. */
  organizationId: string;

  /** Injected from verified JWT — never trusted from client. */
  userId: string;

  /** Unique identifier for this request (from X-Request-ID or generated). */
  requestId: string;
}

// ─── Agent Finding ─────────────────────────────────────────────────────────────

/**
 * A single structured finding produced by an agent.
 *
 * IMPORTANT: The `type` field enforces the evidence vs. inference distinction
 * required for trustworthy decision intelligence.
 *
 * - 'fact':      A claim directly supported by retrieved evidence.
 *                Must have at least one citation.
 * - 'inference': A claim that requires reasoning beyond what evidence directly states.
 *                Example: "The decline appears associated with lower enterprise orders."
 *                Inferences may still have citations but must be presented as inference.
 */
export interface AgentFinding {
  /** The finding or observation text. */
  finding: string;

  /** Whether this is a direct evidence fact or an inference from evidence. */
  type: 'fact' | 'inference';

  /**
   * Citation IDs (S1, S2, ...) supporting this finding.
   * For 'fact' findings, should have at least one citation.
   * For 'inference' findings, citations are optional but encouraged.
   */
  citations: string[];
}

// ─── Agent Risk ────────────────────────────────────────────────────────────────

/**
 * An optional risk identified by the agent.
 * Used by specialized agents that surface business risks (Phase 9+).
 */
export interface AgentRisk {
  /** Description of the risk. */
  risk: string;

  /** Severity level of the risk. */
  severity: 'high' | 'medium' | 'low';
}

// ─── Agent Execution Metadata ─────────────────────────────────────────────────

/**
 * Observability metadata attached to every agent result.
 * Safe to return in API responses — contains NO secrets.
 */
export interface AgentExecutionMetadata {
  agentId: string;
  agentVersion: string;
  requestId: string;

  /** Time taken for vector retrieval (ms). */
  retrievalTimeMs: number;

  /** Time taken for the LLM response (ms). */
  llmTimeMs: number;

  /** Total agent execution time, including retrieval + LLM + validation (ms). */
  totalTimeMs: number;

  /** Number of evidence chunks retrieved from vector search. */
  evidenceCount: number;

  /** Number of evidence chunks actually included in the LLM context. */
  chunksInContext: number;

  /** LLM model used. */
  model: string;

  /** LLM provider used. */
  provider: string;

  /** Agent-specific prompt version used. */
  promptVersion: string;

  /** Approximate LLM input token usage (if reported by provider). */
  inputTokens?: number;

  /** Approximate LLM output token usage (if reported by provider). */
  outputTokens?: number;
}

// ─── Agent Result ─────────────────────────────────────────────────────────────

/**
 * The structured response returned by a specialized agent.
 *
 * Every important claim in the summary/findings must map to evidence in the
 * evidence[] array via citation IDs (S1, S2, ...).
 */
export interface AgentResult {
  /** Agent identifier (e.g., "sales"). */
  agentId: string;

  /** Agent version (e.g., "1.0.0"). */
  agentVersion: string;

  /** Request correlation ID for end-to-end tracing. */
  requestId: string;

  /**
   * High-level natural language summary of the agent's findings.
   * Should cite evidence inline using [S1][S2] notation.
   */
  summary: string;

  /**
   * Ordered list of structured findings.
   * Each finding explicitly states whether it is a 'fact' or 'inference'.
   */
  findings: AgentFinding[];

  /**
   * Fully resolved evidence sources that back the findings.
   * Ordered by citation ID (S1 first).
   */
  evidence: ResolvedSource[];

  /**
   * Overall confidence level of the analysis.
   * Based on evidence availability, relevance, and consistency.
   */
  confidence: ConfidenceLevel;

  /**
   * Known limitations, gaps, or caveats in the analysis.
   * Example: "No competitor data was available in the connected knowledge bases."
   */
  limitations: string[];

  /**
   * Optional risks identified by the agent.
   * Not all agents surface risks in Phase 9.
   */
  risks?: AgentRisk[];

  /** Execution observability metadata. */
  metadata: AgentExecutionMetadata;
}

// ─── Agent List Item ──────────────────────────────────────────────────────────

/**
 * Summary of an available agent returned by GET /api/v1/agents.
 * Derived from AgentMetadata — no internal implementation details.
 */
export interface AgentListItem {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: string[];
}
