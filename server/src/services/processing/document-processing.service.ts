/**
 * Document Processing Service.
 *
 * Orchestrates the full document ingestion pipeline:
 *
 * Phase 6 (existing):
 *   UPLOADED → VALIDATING → PROCESSING → READY
 *   Extracts text from documents using format-specific processors.
 *
 * Phase 7 (extended):
 *   READY → CHUNKING → EMBEDDING → EMBEDDED
 *   Chunks extracted text, generates embeddings, and indexes for vector retrieval.
 *
 * Both phases run in the same async execution — no separate job queue needed.
 * The RAG pipeline is a direct continuation after successful text extraction.
 */

import type { IDocumentProcessor, ExtractedDocumentContent } from './processor.interface';
import { TXTProcessor } from './processors/txt.processor';
import { CSVProcessor } from './processors/csv.processor';
import { XLSXProcessor } from './processors/xlsx.processor';
import { PDFProcessor } from './processors/pdf.processor';
import { DOCXProcessor } from './processors/docx.processor';
import { documentRepository } from '../../repositories/document.repository';
import { documentVersionRepository } from '../../repositories/document-version.repository';
import { documentChunkRepository } from '../../repositories/document-chunk.repository';
import { DOCUMENT_PROCESSING_STATUS } from '../../models/document.model';
import { chunkingService } from '../chunking/chunking.service';
import { embeddingService } from '../embedding/embedding.service';
import { logger } from '../../config/logger.config';
import { auditLogService } from '../auditLog.service';

export class DocumentProcessingService {
  private readonly processors: IDocumentProcessor[];

  constructor() {
    this.processors = [
      new TXTProcessor(),
      new CSVProcessor(),
      new XLSXProcessor(),
      new PDFProcessor(),
      new DOCXProcessor(),
    ];
  }

  private getProcessor(fileType: string): IDocumentProcessor {
    const processor = this.processors.find((p) => p.canProcess(fileType));
    if (!processor) {
      // Fallback strategy to TXTProcessor if no specific processor matched
      return this.processors[0]!;
    }
    return processor;
  }

  /**
   * Full document ingestion pipeline: extraction → chunking → embedding.
   *
   * Phase 6 states: UPLOADED → VALIDATING → PROCESSING → READY
   * Phase 7 states: READY → CHUNKING → EMBEDDING → EMBEDDED
   *
   * On any phase failure, status transitions to FAILED with an error message.
   * The document can be retried from FAILED → CHUNKING using runRagPipeline().
   */
  async processDocument(
    organizationId: string,
    documentId: string,
    fileBuffer: Buffer,
  ): Promise<ExtractedDocumentContent> {
    const doc = await documentRepository.findByOrgAndId(organizationId, documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found in organization ${organizationId}`);
    }

    let extraction: ExtractedDocumentContent | null = null;

    try {
      // ─── Phase 6: Text Extraction ───────────────────────────────────────────

      // 1. UPLOADED/FAILED → VALIDATING (20%)
      await documentRepository.updateStatus(
        organizationId,
        documentId,
        DOCUMENT_PROCESSING_STATUS.VALIDATING,
        20,
      );

      // 2. VALIDATING → PROCESSING (50%)
      await documentRepository.updateStatus(
        organizationId,
        documentId,
        DOCUMENT_PROCESSING_STATUS.PROCESSING,
        50,
      );

      // 3. Select Strategy & Execute Extraction
      const processor = this.getProcessor(doc.fileType);
      const versionLabel = `v${doc.currentVersion}`;
      extraction = await processor.process(fileBuffer, documentId, versionLabel);

      if (extraction.extractionStatus === 'FAILED') {
        throw new Error(extraction.errorDetails ?? 'Document extraction failed.');
      }

      // 4. Record Document Version — the returned entity carries the real UUID id
      //    used as the chunk idempotency key in Phase 7.
      const versionRecord = await documentVersionRepository.create({
        documentId,
        organizationId,
        version: doc.currentVersion,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        storageKey: doc.storageKey,
        checksum: doc.checksum,
        extractedTextLength: extraction.metadata.characterCount,
      });

      // 5. PROCESSING → READY (text extraction complete)
      await documentRepository.updateStatus(
        organizationId,
        documentId,
        DOCUMENT_PROCESSING_STATUS.READY,
        100,
        null,
      );

      await auditLogService.log({
        organizationId,
        userId: doc.uploadedBy,
        action: 'document:process:success',
        resource: 'document',
        resourceId: documentId,
        details: {
          fileType: doc.fileType,
          version: doc.currentVersion,
          extractedLength: extraction.metadata.characterCount,
          documentVersionId: versionRecord.id,
        },
      });

      logger.info(
        { documentId, organizationId, documentVersionId: versionRecord.id },
        `[DocumentProcessor] Document ${documentId} extracted successfully — starting RAG pipeline.`,
      );

      // ─── Phase 7: RAG Ingestion Pipeline ───────────────────────────────────
      // Runs immediately after extraction. Uses the real UUID version ID.
      await this.runRagPipeline(
        organizationId,
        documentId,
        versionRecord.id,        // real UUID, not 'v1' label
        doc.knowledgeBaseId ?? null,
        extraction,
        doc.uploadedBy,
      );

      return extraction;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown processing error';

      // Attempt status transition to FAILED (may fail silently if already in a bad state)
      try {
        await documentRepository.updateStatus(
          organizationId,
          documentId,
          DOCUMENT_PROCESSING_STATUS.FAILED,
          0,
          errorMsg,
        );
      } catch {
        // ignore — status update failure should not mask the original error
      }

      await auditLogService.log({
        organizationId,
        userId: doc.uploadedBy,
        action: 'document:process:failed',
        resource: 'document',
        resourceId: documentId,
        details: { error: errorMsg },
      });

      logger.error(
        { err, documentId, organizationId },
        `[DocumentProcessor] Failed to process document ${documentId}`,
      );

      throw err;
    }
  }

  /**
   * Phase 7 RAG Ingestion Pipeline — can be called standalone for reindexing.
   *
   * States: READY/EMBEDDED/FAILED → CHUNKING → EMBEDDING → EMBEDDED
   *
   * Idempotent: if chunks already exist for this documentVersionId, they are
   * overwritten (embeddingStatus reset to PENDING) and re-embedded.
   *
   * @param organizationId      - Tenant isolation key (required)
   * @param documentId          - Source document ID
   * @param documentVersionId   - Real UUID of the DocumentVersion record
   * @param knowledgeBaseId     - Knowledge base ID (null if unassigned)
   * @param extraction          - Extracted content from the document processor
   * @param triggeredBy         - userId who triggered this pipeline
   */
  async runRagPipeline(
    organizationId: string,
    documentId: string,
    documentVersionId: string,
    knowledgeBaseId: string | null,
    extraction: ExtractedDocumentContent,
    triggeredBy?: string,
  ): Promise<void> {
    try {
      // ── Step 1: READY/EMBEDDED/FAILED → CHUNKING ──────────────────────────
      await documentRepository.updateStatus(
        organizationId,
        documentId,
        DOCUMENT_PROCESSING_STATUS.CHUNKING,
        0,
        null,
      );

      await auditLogService.log({
        organizationId,
        userId: triggeredBy,
        action: 'rag:chunking:started',
        resource: 'document',
        resourceId: documentId,
        details: { documentVersionId },
      });

      // ── Step 2: Delete old chunks for this version (reprocessing safety) ──
      const deletedCount = await documentChunkRepository.deleteByDocumentVersion(
        organizationId,
        documentVersionId,
      );
      if (deletedCount > 0) {
        logger.info(
          { documentId, documentVersionId, deletedCount },
          '[DocumentProcessor] Deleted stale chunks before reindexing.',
        );
      }

      // ── Step 3: Chunk the extracted text ───────────────────────────────────
      const chunkDtos = chunkingService.chunkDocument(
        extraction,
        organizationId,
        knowledgeBaseId,
        documentId,
        documentVersionId,
      );

      if (chunkDtos.length === 0) {
        logger.warn(
          { documentId, documentVersionId },
          '[DocumentProcessor] No chunks produced — document may be empty or too short.',
        );
        // Mark as FAILED — empty document cannot be retrieval-ready
        await documentRepository.updateStatus(
          organizationId,
          documentId,
          DOCUMENT_PROCESSING_STATUS.FAILED,
          0,
          'No chunks produced from extracted text. Document may be empty.',
        );
        return;
      }

      // ── Step 4: Persist chunks (idempotent bulk upsert) ───────────────────
      await documentChunkRepository.bulkUpsert(chunkDtos);

      logger.info(
        { documentId, documentVersionId, chunkCount: chunkDtos.length },
        `[DocumentProcessor] ${chunkDtos.length} chunks persisted for document ${documentId}.`,
      );

      await auditLogService.log({
        organizationId,
        userId: triggeredBy,
        action: 'rag:chunking:completed',
        resource: 'document',
        resourceId: documentId,
        details: { documentVersionId, chunkCount: chunkDtos.length },
      });

      // ── Step 5: CHUNKING → EMBEDDING ──────────────────────────────────────
      await documentRepository.updateStatus(
        organizationId,
        documentId,
        DOCUMENT_PROCESSING_STATUS.EMBEDDING,
        0,
        null,
      );

      // ── Step 6: Generate & store embeddings (batched, rate-limited) ───────
      const embeddingResult = await embeddingService.embedDocumentVersion(
        organizationId,
        documentVersionId,
        triggeredBy,
      );

      // ── Step 7: Determine final state based on embedding results ──────────
      if (embeddingResult.completed === 0 && embeddingResult.failed > 0) {
        // All embeddings failed — document is not retrieval-ready
        await documentRepository.updateStatus(
          organizationId,
          documentId,
          DOCUMENT_PROCESSING_STATUS.FAILED,
          0,
          `All ${embeddingResult.failed} chunk embeddings failed. Check embedding provider configuration.`,
        );

        await auditLogService.log({
          organizationId,
          userId: triggeredBy,
          action: 'rag:embedding:all_failed',
          resource: 'document',
          resourceId: documentId,
          details: { documentVersionId, failed: embeddingResult.failed },
        });

        logger.error(
          { documentId, documentVersionId, failed: embeddingResult.failed },
          '[DocumentProcessor] All embeddings failed — document marked FAILED.',
        );
        return;
      }

      // EMBEDDING → EMBEDDED (even if some chunks failed — partial retrieval)
      await documentRepository.updateStatus(
        organizationId,
        documentId,
        DOCUMENT_PROCESSING_STATUS.EMBEDDED,
        100,
        embeddingResult.failed > 0
          ? `${embeddingResult.failed} chunk(s) failed to embed and will be excluded from retrieval.`
          : null,
      );

      await auditLogService.log({
        organizationId,
        userId: triggeredBy,
        action: 'rag:pipeline:completed',
        resource: 'document',
        resourceId: documentId,
        details: {
          documentVersionId,
          chunksTotal: embeddingResult.totalChunks,
          chunksEmbedded: embeddingResult.completed,
          chunksFailed: embeddingResult.failed,
        },
      });

      logger.info(
        {
          documentId,
          documentVersionId,
          embedded: embeddingResult.completed,
          failed: embeddingResult.failed,
        },
        `[DocumentProcessor] RAG pipeline complete. Document ${documentId} is now EMBEDDED and retrieval-ready.`,
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown RAG pipeline error';

      try {
        await documentRepository.updateStatus(
          organizationId,
          documentId,
          DOCUMENT_PROCESSING_STATUS.FAILED,
          0,
          errorMsg,
        );
      } catch {
        // ignore — status update failure should not mask the original error
      }

      await auditLogService.log({
        organizationId,
        userId: triggeredBy,
        action: 'rag:pipeline:failed',
        resource: 'document',
        resourceId: documentId,
        details: { error: errorMsg },
      });

      logger.error(
        { err, documentId, documentVersionId },
        `[DocumentProcessor] RAG pipeline failed for document ${documentId}.`,
      );
      // Do not re-throw — RAG failure is recoverable via reindex endpoint
    }
  }
}

export const documentProcessingService = new DocumentProcessingService();

