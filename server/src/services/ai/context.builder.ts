/**
 * Context Builder — Phase 8: LLM Integration.
 *
 * Transforms raw EvidenceResultItem[] from the RetrievalService into a
 * structured, token-budgeted context string ready for the LLM, along with
 * a stable citation map.
 *
 * Responsibilities:
 *   1. Select the top-N chunks by score (enforcing MAX_CONTEXT_CHUNKS)
 *   2. Truncate individual chunks to MAX_CHUNK_LENGTH characters
 *   3. Enforce the total character budget (MAX_CONTEXT_CHARS)
 *   4. Assign stable citation IDs: S1, S2, S3, ...
 *   5. Format each chunk with its citation label and source metadata
 *   6. Return the assembled context string AND the citation-to-chunk map
 *
 * The formatted output is what the LLM reads as "business evidence".
 * The citation map is what the ResponseValidator uses to verify the model's
 * citations reference real, authorized chunks.
 *
 * Security note:
 *   Chunks are wrapped in [DOCUMENT CONTENT] markers that the system prompt
 *   instructs the LLM to treat as data, not instructions. This is a defense
 *   layer against prompt injection from malicious document content.
 */

import type { EvidenceResultItem } from '../../modules/retrieval/retrieval.types';
import { config } from '../../config';
import { logger } from '../../config/logger.config';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A resolved citation with enough metadata for the user to inspect the source.
 */
export interface Citation {
  /** Citation label used in the LLM context, e.g. "S1", "S2". */
  id: string;
  /** Original document chunk. */
  chunkId: string;
  organizationId: string;
  knowledgeBaseId: string | null;
  documentId: string;
  documentVersionId: string;
  documentName: string;
  chunkIndex: number;
  /** The relevance score from vector search. */
  score: number;
  /** Truncated text excerpt of this chunk for display. */
  excerpt: string;
  /** Source metadata for display (page, sheet, section). */
  pageNumber?: number;
  sheetName?: string;
  sectionHeading?: string;
}

export interface ContextBuilderResult {
  /** Formatted context text to inject into the LLM prompt. */
  contextText: string;
  /** Ordered citation objects, indexed by their S1/S2/... label. */
  citations: Citation[];
  /** Approximate character count of the context. */
  contextCharCount: number;
  /** Number of chunks included. */
  chunksIncluded: number;
}

// ─── Context Builder ──────────────────────────────────────────────────────────

export class ContextBuilder {
  /**
   * Builds the LLM context from retrieved evidence.
   *
   * @param evidence - Raw results from RetrievalService (already tenant-scoped).
   * @returns        - Formatted context + citation map.
   */
  build(evidence: EvidenceResultItem[]): ContextBuilderResult {
    const maxChunks = config.rag.maxContextChunks;
    const maxContextChars = config.rag.maxContextChars;
    const maxChunkLength = config.rag.maxChunkLength;
    const minScore = config.rag.minEvidenceScore;

    // 1. Filter to qualifying chunks, already sorted by score descending
    const qualifying = evidence
      .filter((item) => item.score >= minScore)
      .slice(0, maxChunks);

    if (qualifying.length === 0) {
      logger.warn('[ContextBuilder] No qualifying chunks after score filter — returning empty context.');
      return { contextText: '', citations: [], contextCharCount: 0, chunksIncluded: 0 };
    }

    const citations: Citation[] = [];
    const contextParts: string[] = [];
    let totalChars = 0;

    for (let i = 0; i < qualifying.length; i++) {
      const item = qualifying[i]!;
      const citationId = `S${i + 1}`;

      // 2. Truncate chunk text to maxChunkLength characters
      const rawText = item.text ?? '';
      const chunkText = rawText.length > maxChunkLength
        ? rawText.slice(0, maxChunkLength) + '...'
        : rawText;

      // 3. Build source header for this chunk
      const sourceParts: string[] = [`Source: ${item.documentName}`];
      if (item.metadata?.pageNumber) {
        sourceParts.push(`Page ${item.metadata.pageNumber}`);
      }
      if (item.metadata?.sheetName) {
        sourceParts.push(`Sheet: ${item.metadata.sheetName}`);
      }
      if (item.metadata?.sectionHeading) {
        sourceParts.push(`Section: ${item.metadata.sectionHeading}`);
      }

      // 4. Format this evidence block
      const block = [
        `[${citationId}] ${sourceParts.join(' | ')}`,
        '---',
        chunkText,
        '---',
      ].join('\n');

      // 5. Enforce total character budget — stop adding if exceeded
      if (totalChars + block.length > maxContextChars && citations.length > 0) {
        logger.debug(
          { citationId, totalChars, blockLength: block.length, maxContextChars },
          '[ContextBuilder] Character budget reached — stopping early.',
        );
        break;
      }

      contextParts.push(block);
      totalChars += block.length;

      // 6. Record citation metadata
      citations.push({
        id: citationId,
        chunkId: item.chunkId,
        organizationId: item.organizationId,
        knowledgeBaseId: item.knowledgeBaseId,
        documentId: item.documentId,
        documentVersionId: item.documentVersionId,
        documentName: item.documentName ?? 'Unknown Document',
        chunkIndex: item.chunkIndex,
        score: item.score,
        excerpt: chunkText.slice(0, 200) + (chunkText.length > 200 ? '...' : ''),
        pageNumber: item.metadata?.pageNumber,
        sheetName: item.metadata?.sheetName,
        sectionHeading: item.metadata?.sectionHeading,
      });
    }

    const contextText = contextParts.join('\n\n');

    logger.info(
      {
        chunksIncluded: citations.length,
        chunksAvailable: qualifying.length,
        contextCharCount: totalChars,
        maxContextChars,
      },
      '[ContextBuilder] Context assembled.',
    );

    return {
      contextText,
      citations,
      contextCharCount: totalChars,
      chunksIncluded: citations.length,
    };
  }
}

export const contextBuilder = new ContextBuilder();
