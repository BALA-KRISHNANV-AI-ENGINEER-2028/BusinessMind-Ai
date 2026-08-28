/**
 * Market Agent Context Builder — Phase 10: Market Intelligence Agent.
 */

import { contextBuilder } from '../../../services/ai/context.builder';
import type { ContextBuilderResult } from '../../../services/ai/context.builder';
import type { EvidenceResultItem } from '../../retrieval/retrieval.types';
import { logger } from '../../../config/logger.config';

export interface MarketContextResult extends ContextBuilderResult {
  evidenceSummary: string;
  evidenceSourceNames: string[];
  hasTemporalContext: boolean;
}

export class MarketContextBuilder {
  build(evidence: EvidenceResultItem[]): MarketContextResult {
    const baseResult = contextBuilder.build(evidence);

    const evidenceSourceNames = [
      ...new Set(evidence.map((e) => e.documentName ?? 'Unknown Document')),
    ];

    const hasTemporalContext = evidence.some((e) => {
      const text = e.text?.toLowerCase() ?? '';
      const sectionHeading = (e.metadata?.sectionHeading ?? '').toLowerCase();
      const temporalPatterns = [/q[1-4]\s*\d{4}/, /\d{4}/, /quarter/, /annual/, /month/, /h[12]\s*\d{4}/];
      return temporalPatterns.some((p) => p.test(text) || p.test(sectionHeading));
    });

    const evidenceSummary =
      baseResult.chunksIncluded === 0
        ? 'No qualifying evidence chunks available.'
        : `${baseResult.chunksIncluded} chunk(s) from ${evidenceSourceNames.length} document(s): ${evidenceSourceNames.join(', ')}.`;

    logger.debug(
      {
        chunksIncluded: baseResult.chunksIncluded,
        evidenceSourceCount: evidenceSourceNames.length,
        hasTemporalContext,
        contextCharCount: baseResult.contextCharCount,
      },
      '[MarketContextBuilder] Market context assembled.',
    );

    return { ...baseResult, evidenceSummary, evidenceSourceNames, hasTemporalContext };
  }
}

export const marketContextBuilder = new MarketContextBuilder();
