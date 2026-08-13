/**
 * Evidence Sufficiency Checker — Phase 8: LLM Integration.
 *
 * Determines whether the retrieved evidence is sufficient to justify
 * calling the LLM. If not, the system returns a standard "insufficient
 * evidence" response without wasting an LLM API call.
 *
 * Rules (all must be true to be considered SUFFICIENT):
 *   1. At least one chunk was retrieved (results.length > 0)
 *   2. At least one chunk's score meets the minEvidenceScore threshold
 *
 * This runs BEFORE context assembly and BEFORE the LLM call.
 * It is intentionally conservative — when in doubt, return insufficient
 * rather than risk fabrication.
 */

import type { EvidenceResultItem } from '../../modules/retrieval/retrieval.types';
import { config } from '../../config';
import { logger } from '../../config/logger.config';

export type EvidenceSufficiencyResult =
  | { sufficient: true }
  | { sufficient: false; reason: string };

export class EvidenceSufficiencyChecker {
  /**
   * Evaluates whether the retrieved evidence set is sufficient to ground an LLM response.
   *
   * @param results - Raw results from RetrievalService.searchEvidence()
   * @returns       - { sufficient: true } or { sufficient: false, reason: string }
   */
  check(results: EvidenceResultItem[]): EvidenceSufficiencyResult {
    const minScore = config.rag.minEvidenceScore;

    // Rule 1: No results at all
    if (results.length === 0) {
      logger.info({ resultsCount: 0 }, '[EvidenceSufficiency] No evidence retrieved — insufficient.');
      return {
        sufficient: false,
        reason: 'No relevant documents were found in the connected knowledge bases for this query.',
      };
    }

    // Rule 2: All scores below the minimum threshold
    const qualifyingChunks = results.filter((r) => r.score >= minScore);
    if (qualifyingChunks.length === 0) {
      logger.info(
        { resultsCount: results.length, topScore: results[0]?.score, minScore },
        '[EvidenceSufficiency] All chunks below minimum score — insufficient.',
      );
      return {
        sufficient: false,
        reason: `Retrieved evidence did not meet the minimum relevance threshold (best match: ${Math.round((results[0]?.score ?? 0) * 100)}% similarity).`,
      };
    }

    logger.debug(
      { resultsCount: results.length, qualifyingCount: qualifyingChunks.length, topScore: results[0]?.score },
      '[EvidenceSufficiency] Evidence sufficient — proceeding to context assembly.',
    );

    return { sufficient: true };
  }
}

export const evidenceSufficiencyChecker = new EvidenceSufficiencyChecker();
