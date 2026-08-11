/**
 * Chunking Strategy Interface — Phase 7: RAG Foundation.
 *
 * Defines the contract that all chunking strategies must implement.
 * The system is strategy-pattern based: ChunkingService selects the
 * appropriate IChunkingStrategy per document type or configuration.
 *
 * Current strategies:
 *   - RecursiveChunkingStrategy  ← Phase 7 baseline
 *
 * Future strategies (Phase 8+):
 *   - SemanticChunkingStrategy   ← sentence-transformer boundary detection
 *   - HierarchicalChunkingStrategy ← section > subsection > paragraph
 */

import type { ExtractedDocumentContent } from '../processing/processor.interface';

// ─── Chunk Input / Output Types ───────────────────────────────────────────────

/**
 * A raw chunk produced by a chunking strategy.
 * The ChunkingService converts these into CreateChunkDto objects for storage.
 */
export interface RawChunk {
  /** 0-based index within the document version. */
  chunkIndex: number;
  /** The chunk text (trimmed, non-empty, within size bounds). */
  text: string;
  /** Estimated token count (character-based approximation: chars / 4). */
  tokenCount: number;
  characterCount: number;
  /** Character offset in the original extractedText. */
  startOffset: number;
  endOffset: number;
  /** Optional structural metadata preserved from the source document. */
  pageNumber?: number;
  sheetName?: string;
  sectionHeading?: string;
}

/**
 * Configuration options for the chunking strategy.
 * All values are sourced from environment variables — never hardcoded.
 */
export interface ChunkingConfig {
  /**
   * Target chunk size in characters.
   * Default: 1000 chars (~250 tokens at 4 chars/token average).
   * Rationale: Fits well within the 8191-token OpenAI embedding limit,
   * gives enough context per chunk, and produces a reasonable number of
   * chunks for typical business documents (1–50 pages).
   */
  chunkSize: number;

  /**
   * Character overlap between adjacent chunks.
   * Default: 200 chars (~20% of chunk size).
   * Rationale: Ensures boundary context is preserved — a sentence that
   * spans a chunk boundary appears in both chunks, preventing retrieval misses.
   */
  chunkOverlap: number;

  /**
   * Minimum chunk character length. Chunks shorter than this are discarded.
   * Default: 50 chars. Guards against noise (e.g. lone headers, whitespace).
   */
  minChunkLength: number;
}

// ─── Strategy Interface ───────────────────────────────────────────────────────

export interface IChunkingStrategy {
  readonly strategyName: string;

  /**
   * Splits extracted document content into raw chunks.
   *
   * @param content  - The normalized extracted content from a document processor.
   * @param config   - Chunking configuration (size, overlap, min length).
   * @returns        - Ordered array of raw chunks, deduplicated and validated.
   */
  chunk(content: ExtractedDocumentContent, config: ChunkingConfig): RawChunk[];
}
