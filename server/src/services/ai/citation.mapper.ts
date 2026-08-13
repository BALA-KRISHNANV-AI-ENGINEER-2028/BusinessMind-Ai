/**
 * Citation Mapper — Phase 8: LLM Integration.
 *
 * Resolves the model's citation labels (["S1", "S2"]) into full source
 * references that can be displayed to the user and inspected for provenance.
 *
 * The CitationMapper is the bridge between:
 *   - The LLM's output citations (string IDs like "S1")
 *   - The ContextBuilder's citation objects (with documentId, chunkId, etc.)
 *
 * It produces the final `sources` array in the API response, which allows
 * users to see exactly which document, page, and chunk grounded each claim.
 *
 * Security:
 *   - Only resolves citations that were validated by ResponseValidator
 *   - Returns an empty array for any citation ID not in the citation map
 *   - organizationId is included in the source metadata for audit purposes
 *     but should NOT be exposed in the public API response
 */

import type { Citation } from './context.builder';
import { logger } from '../../config/logger.config';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A fully-resolved citation source suitable for display in the UI.
 * This is what the frontend renders under "Sources".
 */
export interface ResolvedSource {
  /** Citation label: "S1", "S2", etc. */
  id: string;
  documentId: string;
  documentVersionId: string;
  documentName: string;
  chunkId: string;
  chunkIndex: number;
  /** Page number if the source was a PDF (null otherwise). */
  pageNumber: number | null;
  /** Sheet name if the source was a spreadsheet (null otherwise). */
  sheetName: string | null;
  /** Section heading if detected (null otherwise). */
  sectionHeading: string | null;
  /** Short text excerpt from the chunk for inline preview. */
  excerpt: string;
  /** Relevance score (0–1) for optional display. */
  score: number;
}

// ─── Citation Mapper ──────────────────────────────────────────────────────────

export class CitationMapper {
  /**
   * Resolves validated citation IDs into full source metadata objects.
   *
   * @param validatedCitations - Citation IDs that passed ResponseValidator (e.g., ["S1", "S2"])
   * @param citations          - The full citation map from ContextBuilder
   * @returns                  - Ordered array of resolved sources (same order as validatedCitations)
   */
  resolve(validatedCitations: string[], citations: Citation[]): ResolvedSource[] {
    const citationMap = new Map<string, Citation>(
      citations.map((c) => [c.id, c]),
    );

    const resolved: ResolvedSource[] = [];

    for (const citationId of validatedCitations) {
      const citation = citationMap.get(citationId);

      if (!citation) {
        // This should not happen if ResponseValidator ran first, but guard anyway
        logger.warn({ citationId }, '[CitationMapper] Citation ID not found in map — skipping.');
        continue;
      }

      resolved.push({
        id: citation.id,
        documentId: citation.documentId,
        documentVersionId: citation.documentVersionId,
        documentName: citation.documentName,
        chunkId: citation.chunkId,
        chunkIndex: citation.chunkIndex,
        pageNumber: citation.pageNumber ?? null,
        sheetName: citation.sheetName ?? null,
        sectionHeading: citation.sectionHeading ?? null,
        excerpt: citation.excerpt,
        score: citation.score,
      });
    }

    logger.debug(
      { resolvedCount: resolved.length, requestedCount: validatedCitations.length },
      '[CitationMapper] Citations resolved.',
    );

    return resolved;
  }
}

export const citationMapper = new CitationMapper();
