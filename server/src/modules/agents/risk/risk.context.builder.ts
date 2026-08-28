/**
 * Risk Agent Context Builder — Phase 10: Risk Intelligence Agent.
 *
 * Risk analysis benefits from cross-domain evidence — retrieval
 * is intentionally broad so risks from finance, inventory, customer,
 * and market signals can all be surfaced from a single query.
 */

import { contextBuilder } from '../../../services/ai/context.builder';
import type { ContextBuilderResult } from '../../../services/ai/context.builder';
import type { EvidenceResultItem } from '../../retrieval/retrieval.types';
import { logger } from '../../../config/logger.config';

export interface RiskContextResult extends ContextBuilderResult {
  evidenceSummary: string;
  evidenceSourceNames: string[];
  hasTemporalContext: boolean;
  /** Distinct domains identified in the evidence set (for observability). */
  evidenceDomains: string[];
}

export class RiskContextBuilder {
  build(evidence: EvidenceResultItem[]): RiskContextResult {
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

    // Detect likely risk domains from evidence for observability
    const evidenceDomains: string[] = [];
    const allText = evidence.map((e) => (e.text ?? '') + ' ' + (e.metadata?.sectionHeading ?? '')).join(' ').toLowerCase();

    if (/revenue|profit|expense|margin|cash/.test(allText)) evidenceDomains.push('finance');
    if (/customer|churn|retention|satisfaction/.test(allText)) evidenceDomains.push('customer');
    if (/stock|inventory|sku|warehouse|supply/.test(allText)) evidenceDomains.push('inventory');
    if (/market|competitor|industry|sector/.test(allText)) evidenceDomains.push('market');
    if (/sales|order|pipeline|territory/.test(allText)) evidenceDomains.push('sales');

    const evidenceSummary =
      baseResult.chunksIncluded === 0
        ? 'No qualifying evidence chunks available.'
        : `${baseResult.chunksIncluded} chunk(s) from ${evidenceSourceNames.length} document(s) — domains detected: ${evidenceDomains.join(', ') || 'unknown'}.`;

    logger.debug(
      {
        chunksIncluded: baseResult.chunksIncluded,
        evidenceSourceCount: evidenceSourceNames.length,
        hasTemporalContext,
        evidenceDomains,
        contextCharCount: baseResult.contextCharCount,
      },
      '[RiskContextBuilder] Risk context assembled.',
    );

    return { ...baseResult, evidenceSummary, evidenceSourceNames, hasTemporalContext, evidenceDomains };
  }
}

export const riskContextBuilder = new RiskContextBuilder();
