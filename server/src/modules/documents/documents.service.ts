/**
 * Documents Service.
 *
 * Implements multi-tenant document upload, validation, storage integration,
 * processing orchestration, state monitoring, and soft deletion.
 */

import { documentRepository, DocumentEntity, DocumentFilterOptions } from '../../repositories/document.repository';
import { storageProvider } from '../../services/storage/storage.factory';
import { generateStorageKey } from '../../middlewares/upload.middleware';
import { documentProcessingService } from '../../services/processing/document-processing.service';
import type { UpdateDocumentInput, DocumentQueryInput } from './documents.types';
import type { PaginationMeta } from '../../types/common.types';
import { AppError } from '../../errors/AppError';
import { HttpStatus } from '../../constants/http.constants';
import { DOCUMENT_PROCESSING_STATUS } from '../../models/document.model';
import { auditLogService } from '../../services/auditLog.service';
import type { Readable } from 'stream';

export class DocumentsService {
  async upload(
    organizationId: string,
    userId: string,
    file: Express.Multer.File,
    knowledgeBaseId?: string,
  ): Promise<DocumentEntity> {
    if (!file || !file.buffer) {
      throw new AppError('No file buffer provided in upload request.', HttpStatus.BAD_REQUEST, 'NO_FILE_PROVIDED', true);
    }

    const { storageKey, fileType } = generateStorageKey(organizationId, file.originalname);

    // Store raw file via StorageProvider
    const storageResult = await storageProvider.uploadFile(file.buffer, storageKey, file.mimetype);

    // Create Document record with initial UPLOADED status
    const doc = await documentRepository.create({
      organizationId,
      uploadedBy: userId,
      originalFilename: file.originalname,
      displayName: file.originalname,
      fileType,
      mimeType: file.mimetype,
      fileSize: file.size,
      storageProvider: storageResult.provider,
      storageKey: storageResult.key,
      checksum: storageResult.checksum,
      processingStatus: DOCUMENT_PROCESSING_STATUS.UPLOADED,
      knowledgeBaseId: knowledgeBaseId ?? null,
    });

    await auditLogService.log({
      organizationId,
      userId,
      action: 'document:upload',
      resource: 'document',
      resourceId: doc.id,
      details: { filename: doc.originalFilename, size: doc.fileSize, mimeType: doc.mimeType },
    });

    // Trigger processing pipeline (non-blocking / async process)
    setImmediate(() => {
      documentProcessingService.processDocument(organizationId, doc.id, file.buffer).catch((err) => {
        // Errors handled inside documentProcessingService & logged to AuditLog
      });
    });

    return doc;
  }

  async getAll(
    organizationId: string,
    query: DocumentQueryInput,
  ): Promise<{ data: DocumentEntity[]; pagination: PaginationMeta }> {
    const filterOpts: DocumentFilterOptions = {
      search: query.search,
      status: query.status,
      fileType: query.fileType,
      knowledgeBaseId: query.knowledgeBaseId,
    };

    return documentRepository.findAllByOrg(
      organizationId,
      {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 10,
        sortBy: query.sortBy ?? 'createdAt',
        sortDirection: query.sortDirection ?? 'desc',
      },
      filterOpts,
    );
  }

  async getById(organizationId: string, id: string): Promise<DocumentEntity> {
    const doc = await documentRepository.findByOrgAndId(organizationId, id);
    if (!doc) {
      throw new AppError(
        'Document not found.',
        HttpStatus.NOT_FOUND,
        'DOCUMENT_NOT_FOUND',
        true,
      );
    }
    return doc;
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdateDocumentInput,
  ): Promise<DocumentEntity> {
    await this.getById(organizationId, id);

    const updated = await documentRepository.update(id, input);
    if (!updated) {
      throw new AppError('Failed to update document metadata.', HttpStatus.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', false);
    }

    await auditLogService.log({
      organizationId,
      userId,
      action: 'document:update',
      resource: 'document',
      resourceId: id,
      details: { updates: input },
    });

    return updated;
  }

  async delete(organizationId: string, userId: string, id: string): Promise<void> {
    const doc = await this.getById(organizationId, id);

    const success = await documentRepository.softDeleteByOrg(organizationId, id);
    if (!success) {
      throw new AppError('Failed to delete document.', HttpStatus.INTERNAL_SERVER_ERROR, 'DELETE_FAILED', false);
    }

    await auditLogService.log({
      organizationId,
      userId,
      action: 'document:delete',
      resource: 'document',
      resourceId: id,
      details: { name: doc.displayName },
    });
  }

  async getStatus(
    organizationId: string,
    id: string,
  ): Promise<{
    id: string;
    processingStatus: string;
    processingProgress: number;
    processingError?: string | null;
  }> {
    const doc = await this.getById(organizationId, id);
    return {
      id: doc.id,
      processingStatus: doc.processingStatus,
      processingProgress: doc.processingProgress,
      processingError: doc.processingError,
    };
  }

  async getDownloadStream(
    organizationId: string,
    id: string,
  ): Promise<{ stream: Readable; doc: DocumentEntity }> {
    const doc = await this.getById(organizationId, id);
    const stream = await storageProvider.getFileStream(doc.storageKey);
    return { stream, doc };
  }

  async reprocess(organizationId: string, userId: string, id: string): Promise<DocumentEntity> {
    const doc = await this.getById(organizationId, id);

    const newVersion = doc.currentVersion + 1;
    await documentRepository.update(id, { currentVersion: newVersion });

    // Stream file buffer to re-process
    const stream = await storageProvider.getFileStream(doc.storageKey);
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk as Buffer | Uint8Array));
    }
    const buffer = Buffer.concat(chunks);

    setImmediate(() => {
      documentProcessingService.processDocument(organizationId, id, buffer).catch(() => {});
    });

    await auditLogService.log({
      organizationId,
      userId,
      action: 'document:reprocess',
      resource: 'document',
      resourceId: id,
      details: { newVersion },
    });

    return this.getById(organizationId, id);
  }
}

export const documentsService = new DocumentsService();
