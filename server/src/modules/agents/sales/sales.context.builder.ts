/**
 * Sales Agent Context Builder — Phase 9: Sales Intelligence Agent.
 *
 * Prepares the evidence context for the Sales Intelligence Agent.
 *
 * Extends the Phase 8 ContextBuilder behavior with sales-domain awareness:
 *   1. Reuses the Phase 8 ContextBuilder for core token budgeting and citation assignment
 *   2. Adds sales-domain metadata enrichment (periods, segments, etc.)
 *   3. Provides a sales-specific summary header that helps the LLM understand
 *      the temporal and domain context of the retrieved evidence
 *
 * IMPORTANT:
 *   This builder does NOT perform a separate vector search.
 *   Retrieval is performed upstream by the SalesIntelligenceAgent, which passes
 *   raw EvidenceResultItem[] to this builder.
 *
 * Design rationale:
 *   We keep retrieval and context-building separate so:
 *   - Retrieval can be tuned independently (topK, minScore)
 *   - Context building can be tuned independently (budgets, format)
 *   - Tests can exercise either layer in isolation
 */

import { contextBuilder } from '../../../services/ai/context.builder';
import type { ContextBuilderResult } from '../../../services/ai/context.builder';
import type { EvidenceResultItem } from '../../retrieval/retrieval.types';
import { logger } from '../../../config/logger.config';

// ─── Sales Context Result ─────────────────────────────────────────────────────

/**
 * Extended context result for the Sales Agent.
 * Wraps the Phase 8 ContextBuilderResult with domain-specific enrichment.
 */
export interface SalesContextResult extends ContextBuilderResult {
  /**
   * A short natural-language summary of the evidence set for debugging.
   * Not included in the LLM prompt — used for logging only.
   */
  evidenceSummary: string;

  /**
   * Distinct document names in the evidence set.
   * Used for logging and observability.
   */
  evidenceSourceNames: string[];

  /**
   * Whether any time-period metadata was detected in the evidence.
   * Helps the calling agent warn about temporal ambiguity.
   */
  hasTemporalContext: boolean;
}

// ─── Sales Context Builder ────────────────────────────────────────────────────

export class SalesContextBuilder {
  /**
   * Builds the LLM context for a sales intelligence query.
   *
   * @param evidence - Raw results from RetrievalService (already tenant-scoped).
   * @returns        - Formatted context + citation map + sales-domain metadata.
   */
  build(evidence: EvidenceResultItem[]): SalesContextResult {
    // Delegate core token budgeting and citation assignment to the Phase 8 builder
    const baseResult = contextBuilder.build(evidence);

    // Compute sales-domain metadata for logging and observability
    const evidenceSourceNames = [
      ...new Set(evidence.map((e) => e.documentName ?? 'Unknown Document')),
    ];

    // Detect temporal context: does any chunk have period-related metadata?
    const hasTemporalContext = evidence.some((e) => {
      const text = e.text?.toLowerCase() ?? '';
      // Look for quarter/year/month markers in chunk text or section headings
      const sectionHeading = (e.metadata?.sectionHeading ?? '').toLowerCase();
      const temporalPatterns = [/q[1-4]\s*\d{4}/, /\d{4}/, /quarter/, /annual/, /month/];
      return temporalPatterns.some((p) => p.test(text) || p.test(sectionHeading));
    });

    const evidenceSummary =
      baseResult.chunksIncluded === 0
        ? 'No qualifying evidence chunks available.'
        : `${baseResult.chunksIncluded} evidence chunk(s) from ${evidenceSourceNames.length} document(s): ${evidenceSourceNames.join(', ')}.`;

    logger.debug(
      {
        chunksIncluded: baseResult.chunksIncluded,
        evidenceSourceCount: evidenceSourceNames.length,
        hasTemporalContext,
        contextCharCount: baseResult.contextCharCount,
      },
      '[SalesContextBuilder] Sales context assembled.',
    );

    return {
      ...baseResult,
      evidenceSummary,
      evidenceSourceNames,
      hasTemporalContext,
    };
  }
}

export const salesContextBuilder = new SalesContextBuilder();
