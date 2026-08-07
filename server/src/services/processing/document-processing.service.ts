/**
 * Document Processing Service.
 *
 * Orchestrates document content extraction, state machine transitions, version recording,
 * and error handling using the strategy pattern.
 */

import type { IDocumentProcessor, ExtractedDocumentContent } from './processor.interface';
import { TXTProcessor } from './processors/txt.processor';
import { CSVProcessor } from './processors/csv.processor';
import { XLSXProcessor } from './processors/xlsx.processor';
import { PDFProcessor } from './processors/pdf.processor';
import { DOCXProcessor } from './processors/docx.processor';
import { documentRepository } from '../../repositories/document.repository';
import { documentVersionRepository } from '../../repositories/document-version.repository';
import { DOCUMENT_PROCESSING_STATUS } from '../../models/document.model';
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

  async processDocument(
    organizationId: string,
    documentId: string,
    fileBuffer: Buffer,
  ): Promise<ExtractedDocumentContent> {
    const doc = await documentRepository.findByOrgAndId(organizationId, documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found in organization ${organizationId}`);
    }

    try {
      // 1. Transition: UPLOADING/UPLOADED -> VALIDATING (20%)
      await documentRepository.updateStatus(
        organizationId,
        documentId,
        DOCUMENT_PROCESSING_STATUS.VALIDATING,
        20,
      );

      // 2. Transition: VALIDATING -> PROCESSING (50%)
      await documentRepository.updateStatus(
        organizationId,
        documentId,
        DOCUMENT_PROCESSING_STATUS.PROCESSING,
        50,
      );

      // 3. Select Strategy & Execute Extraction
      const processor = this.getProcessor(doc.fileType);
      const versionId = `v${doc.currentVersion}`;
      const extraction = await processor.process(fileBuffer, documentId, versionId);

      if (extraction.extractionStatus === 'FAILED') {
        throw new Error(extraction.errorDetails ?? 'Document extraction failed.');
      }

      // 4. Record Document Version Record
      await documentVersionRepository.create({
        documentId,
        organizationId,
        version: doc.currentVersion,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        storageKey: doc.storageKey,
        checksum: doc.checksum,
        extractedTextLength: extraction.metadata.characterCount,
      });

      // 5. Transition: PROCESSING -> READY (100%)
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
        },
      });

      logger.info({ documentId, organizationId }, `[DocumentProcessor] Document ${documentId} processed successfully.`);

      return extraction;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown processing error';

      await documentRepository.updateStatus(
        organizationId,
        documentId,
        DOCUMENT_PROCESSING_STATUS.FAILED,
        0,
        errorMsg,
      );

      await auditLogService.log({
        organizationId,
        userId: doc.uploadedBy,
        action: 'document:process:failed',
        resource: 'document',
        resourceId: documentId,
        details: { error: errorMsg },
      });

      logger.error({ err, documentId, organizationId }, `[DocumentProcessor] Failed to process document ${documentId}`);

      throw err;
    }
  }
}

export const documentProcessingService = new DocumentProcessingService();
