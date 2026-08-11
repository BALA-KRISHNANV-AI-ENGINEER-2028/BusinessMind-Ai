/**
 * Chunking Service — Phase 7: RAG Foundation.
 *
 * Orchestrates document text chunking using a configurable IChunkingStrategy.
 * Converts RawChunk objects into CreateChunkDto objects suitable for persistence.
 * Reads chunk configuration from the application config (env vars).
 *
 * Data flow:
 *   ExtractedDocumentContent
 *       ↓
 *   ChunkingService.chunkDocument()
 *       ↓
 *   IChunkingStrategy.chunk()
 *       ↓
 *   RawChunk[]
 *       ↓
 *   CreateChunkDto[]  ← ready for DocumentChunkRepository.bulkUpsert()
 */

import { RecursiveChunkingStrategy } from './recursive-chunking.strategy';
import type { IChunkingStrategy, ChunkingConfig } from './chunking.interface';
import type { ExtractedDocumentContent } from '../processing/processor.interface';
import type { CreateChunkDto } from '../../repositories/document-chunk.repository';
import { config } from '../../config';
import { logger } from '../../config/logger.config';

export class ChunkingService {
  private readonly strategy: IChunkingStrategy;
  private readonly chunkingConfig: ChunkingConfig;

  constructor(strategy?: IChunkingStrategy) {
    // Default strategy: recursive character splitting
    this.strategy = strategy ?? new RecursiveChunkingStrategy();

    this.chunkingConfig = {
      chunkSize: config.rag.chunkSize,
      chunkOverlap: config.rag.chunkOverlap,
      minChunkLength: 50,
    };
  }

  /**
   * Chunks the extracted content of a document version.
   * Returns CreateChunkDto objects ready for bulkUpsert.
   *
   * @param content        - ExtractedDocumentContent from the document processor
   * @param organizationId - Tenant ID (required for isolation)
   * @param knowledgeBaseId - KB ID (may be null for unassigned documents)
   * @param documentId     - Document ID
   * @param documentVersionId - Document version ID (idempotency key component)
   */
  chunkDocument(
    content: ExtractedDocumentContent,
    organizationId: string,
    knowledgeBaseId: string | null,
    documentId: string,
    documentVersionId: string,
  ): CreateChunkDto[] {
    if (!content.extractedText || content.extractedText.trim().length === 0) {
      logger.warn(
        { documentId, documentVersionId },
        '[ChunkingService] Empty extracted text — skipping chunking.',
      );
      return [];
    }

    const rawChunks = this.strategy.chunk(content, this.chunkingConfig);

    logger.info(
      {
        documentId,
        documentVersionId,
        chunkCount: rawChunks.length,
        strategy: this.strategy.strategyName,
        chunkSize: this.chunkingConfig.chunkSize,
        chunkOverlap: this.chunkingConfig.chunkOverlap,
      },
      `[ChunkingService] Produced ${rawChunks.length} chunks for document ${documentId}.`,
    );

    return rawChunks.map((chunk) => ({
      organizationId,
      knowledgeBaseId,
      documentId,
      documentVersionId,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      tokenCount: chunk.tokenCount,
      characterCount: chunk.characterCount,
      metadata: {
        pageNumber: chunk.pageNumber,
        sheetName: chunk.sheetName,
        sectionHeading: chunk.sectionHeading,
        startOffset: chunk.startOffset,
        endOffset: chunk.endOffset,
      },
    }));
  }

  get strategyName(): string {
    return this.strategy.strategyName;
  }

  get config(): ChunkingConfig {
    return { ...this.chunkingConfig };
  }
}

export const chunkingService = new ChunkingService();
