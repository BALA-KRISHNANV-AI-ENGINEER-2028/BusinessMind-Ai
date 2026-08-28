/**
 * Customer Agent Context Builder — Phase 10: Customer Intelligence Agent.
 *
 * Prepares the evidence context for the Customer Intelligence Agent.
 * Follows the same pattern as SalesContextBuilder and FinanceContextBuilder.
 *
 * Privacy note:
 *   This builder passes evidence text through to the shared ContextBuilder.
 *   The prompt instructs the LLM to apply data minimization.
 *   Sensitive customer fields are NOT stripped here — that would require
 *   knowing the document schema. Instead, the prompt enforces minimization at
 *   the LLM level. The organizationId filter in RetrievalService ensures
 *   only authorized customer data is retrieved.
 */

import { contextBuilder } from '../../../services/ai/context.builder';
import type { ContextBuilderResult } from '../../../services/ai/context.builder';
import type { EvidenceResultItem } from '../../retrieval/retrieval.types';
import { logger } from '../../../config/logger.config';

// ─── Customer Context Result ──────────────────────────────────────────────────

export interface CustomerContextResult extends ContextBuilderResult {
  evidenceSummary: string;
  evidenceSourceNames: string[];
  hasTemporalContext: boolean;
}

// ─── Customer Context Builder ─────────────────────────────────────────────────

export class CustomerContextBuilder {
  build(evidence: EvidenceResultItem[]): CustomerContextResult {
    const baseResult = contextBuilder.build(evidence);

    const evidenceSourceNames = [
      ...new Set(evidence.map((e) => e.documentName ?? 'Unknown Document')),
    ];

    const hasTemporalContext = evidence.some((e) => {
      const text = e.text?.toLowerCase() ?? '';
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
        // NOTE: Do not log chunk text here — may contain customer PII
      },
      '[CustomerContextBuilder] Customer context assembled.',
    );

    return {
      ...baseResult,
      evidenceSummary,
      evidenceSourceNames,
      hasTemporalContext,
    };
  }
}

export const customerContextBuilder = new CustomerContextBuilder();
