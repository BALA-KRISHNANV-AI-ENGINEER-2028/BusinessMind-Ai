/**
 * Finance Agent Context Builder — Phase 10: Finance Intelligence Agent.
 *
 * Prepares the evidence context for the Finance Intelligence Agent.
 *
 * Follows the same pattern as SalesContextBuilder (Phase 9):
 *   1. Reuses the Phase 8 ContextBuilder for core token budgeting and citation assignment
 *   2. Adds finance-domain metadata enrichment (periods, financial statement types)
 *   3. Provides logging observability for the finance evidence set
 *
 * IMPORTANT:
 *   This builder does NOT perform a separate vector search.
 *   Retrieval is performed upstream by the FinanceIntelligenceAgent, which passes
 *   raw EvidenceResultItem[] to this builder.
 */

import { contextBuilder } from '../../../services/ai/context.builder';
import type { ContextBuilderResult } from '../../../services/ai/context.builder';
import type { EvidenceResultItem } from '../../retrieval/retrieval.types';
import { logger } from '../../../config/logger.config';

// ─── Finance Context Result ───────────────────────────────────────────────────

/**
 * Extended context result for the Finance Agent.
 * Wraps the Phase 8 ContextBuilderResult with finance-domain metadata.
 */
export interface FinanceContextResult extends ContextBuilderResult {
  /**
   * A short natural-language summary of the evidence set for logging.
   * Not included in the LLM prompt.
   */
  evidenceSummary: string;

  /**
   * Distinct document names in the evidence set.
   */
  evidenceSourceNames: string[];

  /**
   * Whether any financial period metadata was detected in the evidence.
   * Helps warn about temporal ambiguity.
   */
  hasTemporalContext: boolean;
}

// ─── Finance Context Builder ──────────────────────────────────────────────────

export class FinanceContextBuilder {
  /**
   * Builds the LLM context for a finance intelligence query.
   *
   * @param evidence - Raw results from RetrievalService (already tenant-scoped).
   * @returns        - Formatted context + citation map + finance-domain metadata.
   */
  build(evidence: EvidenceResultItem[]): FinanceContextResult {
    // Delegate core token budgeting and citation assignment to the Phase 8 builder
    const baseResult = contextBuilder.build(evidence);

    // Compute finance-domain metadata for logging and observability
    const evidenceSourceNames = [
      ...new Set(evidence.map((e) => e.documentName ?? 'Unknown Document')),
    ];

    // Detect temporal context: does any chunk have period-related metadata?
    const hasTemporalContext = evidence.some((e) => {
      const text = e.text?.toLowerCase() ?? '';
      const sectionHeading = (e.metadata?.sectionHeading ?? '').toLowerCase();
      const temporalPatterns = [/q[1-4]\s*\d{4}/, /\d{4}/, /quarter/, /annual/, /month/, /fy\s*\d{2,4}/];
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
      '[FinanceContextBuilder] Finance context assembled.',
    );

    return {
      ...baseResult,
      evidenceSummary,
      evidenceSourceNames,
      hasTemporalContext,
    };
  }
}

export const financeContextBuilder = new FinanceContextBuilder();
