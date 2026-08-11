/**
 * Embedding Service — Phase 7: RAG Foundation.
 *
 * Orchestrates batch embedding generation with:
 *   - Controlled concurrency (batches of EMBEDDING_BATCH_SIZE)
 *   - Rate-limit delays between batches (100ms default)
 *   - Per-chunk error handling (one failed chunk does not abort the rest)
 *   - Idempotency: already-COMPLETED chunks are skipped
 *   - Dimension validation before storage
 *   - Audit logging for embedding started/completed/failed
 *
 * Data flow:
 *   documentVersionId
 *       ↓
 *   chunkRepository.findPendingByDocumentVersion()
 *       ↓
 *   Batch into groups of BATCH_SIZE
 *       ↓
 *   embeddingProvider.generateEmbeddings(batchTexts)
 *       ↓
 *   chunkRepository.updateEmbedding(chunkId, vector)
 *       ↓
 *   EmbeddingResult (counts of completed / failed)
 */

import type { IEmbeddingProvider } from './embedding.interface';
import { embeddingProvider } from './embedding.factory';
import { documentChunkRepository } from '../../repositories/document-chunk.repository';
import { auditLogService } from '../auditLog.service';
import { logger } from '../../config/logger.config';
import { config } from '../../config';

export interface EmbeddingResult {
  documentVersionId: string;
  totalChunks: number;
  completed: number;
  failed: number;
  skipped: number;
}

export class EmbeddingService {
  private readonly provider: IEmbeddingProvider;

  /** Number of chunks to embed in a single API call batch. */
  private readonly BATCH_SIZE = 20;

  /** Delay in ms between batches to avoid rate limiting. */
  private readonly BATCH_DELAY_MS = 100;

  constructor(provider?: IEmbeddingProvider) {
    this.provider = provider ?? embeddingProvider;
  }

  /**
   * Embeds all pending chunks for a specific document version.
   * Idempotent: re-running this method skips already-COMPLETED chunks.
   */
  async embedDocumentVersion(
    organizationId: string,
    documentVersionId: string,
    triggeredBy?: string,
  ): Promise<EmbeddingResult> {
    const pendingChunks = await documentChunkRepository.findPendingByDocumentVersion(
      organizationId,
      documentVersionId,
    );

    const result: EmbeddingResult = {
      documentVersionId,
      totalChunks: pendingChunks.length,
      completed: 0,
      failed: 0,
      skipped: 0,
    };

    if (pendingChunks.length === 0) {
      logger.info(
        { organizationId, documentVersionId },
        '[EmbeddingService] No pending chunks to embed.',
      );
      return result;
    }

    logger.info(
      {
        organizationId,
        documentVersionId,
        pendingCount: pendingChunks.length,
        provider: this.provider.info.provider,
        model: this.provider.info.model,
      },
      `[EmbeddingService] Starting embedding of ${pendingChunks.length} chunks.`,
    );

    await auditLogService.log({
      organizationId,
      userId: triggeredBy,
      action: 'rag:embedding:started',
      resource: 'documentVersion',
      resourceId: documentVersionId,
      details: {
        pendingChunks: pendingChunks.length,
        provider: this.provider.info.provider,
        model: this.provider.info.model,
      },
    });

    // Process chunks in batches to control rate limiting
    for (let i = 0; i < pendingChunks.length; i += this.BATCH_SIZE) {
      const batch = pendingChunks.slice(i, i + this.BATCH_SIZE);

      // Add delay between batches (not before the first one)
      if (i > 0) {
        await this.delay(this.BATCH_DELAY_MS);
      }

      await this.processBatch(batch, result);
    }

    logger.info(
      {
        organizationId,
        documentVersionId,
        completed: result.completed,
        failed: result.failed,
      },
      `[EmbeddingService] Embedding complete. ${result.completed} succeeded, ${result.failed} failed.`,
    );

    await auditLogService.log({
      organizationId,
      userId: triggeredBy,
      action: result.failed > 0 ? 'rag:embedding:partial' : 'rag:embedding:completed',
      resource: 'documentVersion',
      resourceId: documentVersionId,
      details: {
        completed: result.completed,
        failed: result.failed,
        skipped: result.skipped,
      },
    });

    return result;
  }

  private async processBatch(
    chunks: Awaited<ReturnType<typeof documentChunkRepository.findPendingByDocumentVersion>>,
    result: EmbeddingResult,
  ): Promise<void> {
    const texts = chunks.map((c) => c.text);

    try {
      const vectors = await this.provider.generateEmbeddings(texts);

      // Update each chunk individually — a partial batch failure only affects that chunk
      for (let j = 0; j < chunks.length; j++) {
        const chunk = chunks[j]!;
        const vector = vectors[j];

        if (!vector || vector.length === 0) {
          await documentChunkRepository.markEmbeddingFailed(
            chunk.id,
            'Provider returned empty vector for this chunk.',
          );
          result.failed++;
          continue;
        }

        try {
          await documentChunkRepository.updateEmbedding(
            chunk.id,
            vector,
            this.provider.info.model,
            this.provider.info.dimensions,
          );
          result.completed++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error updating embedding';
          await documentChunkRepository.markEmbeddingFailed(chunk.id, msg);
          result.failed++;
          logger.error({ err, chunkId: chunk.id }, '[EmbeddingService] Failed to store embedding.');
        }
      }
    } catch (err) {
      // If the entire batch API call fails, mark all chunks in the batch as failed
      logger.error(
        { err, batchSize: chunks.length },
        '[EmbeddingService] Batch embedding API call failed — marking batch as FAILED.',
      );
      await Promise.allSettled(
        chunks.map((c) =>
          documentChunkRepository.markEmbeddingFailed(
            c.id,
            err instanceof Error ? err.message : 'Batch API call failed',
          ),
        ),
      );
      result.failed += chunks.length;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  get providerInfo() {
    return this.provider.info;
  }
}

export const embeddingService = new EmbeddingService();
