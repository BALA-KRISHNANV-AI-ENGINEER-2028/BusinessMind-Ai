/**
 * Document Repository.
 *
 * Mongoose repository for document metadata, query filtering, state machine updates,
 * and organization isolation.
 */

import { BaseRepository } from './base.repository';
import {
  DocumentModel,
  IDocumentDocument,
  DocumentProcessingStatus,
  DOCUMENT_PROCESSING_STATUS,
  isValidStatusTransition,
} from '../models/document.model';
import type { PaginationOptions, PaginationMeta } from '../types/common.types';
import type { FilterQuery } from 'mongoose';
import { AppError } from '../errors/AppError';
import { HttpStatus } from '../constants/http.constants';

export interface DocumentEntity {
  id: string;
  organizationId: string;
  knowledgeBaseId?: string | null;
  uploadedBy: string;
  originalFilename: string;
  displayName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  storageProvider: 'local' | 'cloudinary';
  storageKey: string;
  checksum: string;
  processingStatus: DocumentProcessingStatus;
  processingProgress: number;
  processingError?: string | null;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type CreateDocumentDto = Omit<
  DocumentEntity,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'processingProgress'
  | 'processingError'
  | 'currentVersion'
> & {
  processingProgress?: number;
  processingError?: string | null;
  currentVersion?: number;
};

export type UpdateDocumentDto = Partial<
  Omit<DocumentEntity, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>
>;

export interface DocumentFilterOptions {
  search?: string;
  status?: string;
  fileType?: string;
  knowledgeBaseId?: string;
  includeDeleted?: boolean;
}

export class DocumentRepository extends BaseRepository<
  IDocumentDocument,
  DocumentEntity,
  CreateDocumentDto,
  UpdateDocumentDto
> {
  constructor() {
    super(DocumentModel);
  }

  protected toEntity(doc: IDocumentDocument): DocumentEntity {
    const json = doc.toJSON() as Record<string, unknown>;
    return {
      id: String(json['id'] ?? json['_id']),
      organizationId: String(json['organizationId']),
      knowledgeBaseId: json['knowledgeBaseId'] ? String(json['knowledgeBaseId']) : null,
      uploadedBy: String(json['uploadedBy']),
      originalFilename: String(json['originalFilename']),
      displayName: String(json['displayName']),
      fileType: String(json['fileType']),
      mimeType: String(json['mimeType']),
      fileSize: Number(json['fileSize']),
      storageProvider: (json['storageProvider'] as 'local' | 'cloudinary') ?? 'local',
      storageKey: String(json['storageKey']),
      checksum: String(json['checksum']),
      processingStatus: json['processingStatus'] as DocumentProcessingStatus,
      processingProgress: Number(json['processingProgress'] ?? 0),
      processingError: json['processingError'] ? String(json['processingError']) : null,
      currentVersion: Number(json['currentVersion'] ?? 1),
      createdAt: json['createdAt'] ? new Date(json['createdAt'] as string).toISOString() : new Date().toISOString(),
      updatedAt: json['updatedAt'] ? new Date(json['updatedAt'] as string).toISOString() : new Date().toISOString(),
      deletedAt: json['deletedAt'] ? new Date(json['deletedAt'] as string).toISOString() : null,
    };
  }

  async findByOrgAndId(
    organizationId: string,
    id: string,
    includeDeleted = false,
  ): Promise<DocumentEntity | null> {
    const filter: FilterQuery<IDocumentDocument> = { _id: id, organizationId };
    if (!includeDeleted) {
      filter.deletedAt = null;
    }
    const doc = await this.model.findOne(filter).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findAllByOrg(
    organizationId: string,
    pagination: PaginationOptions,
    filters: DocumentFilterOptions = {},
  ): Promise<{ data: DocumentEntity[]; pagination: PaginationMeta }> {
    const queryFilter: FilterQuery<IDocumentDocument> = {
      organizationId,
    };

    if (!filters.includeDeleted) {
      queryFilter.deletedAt = null;
    }

    if (filters.status && filters.status !== 'all') {
      queryFilter.processingStatus = filters.status;
    }

    if (filters.fileType && filters.fileType !== 'all') {
      queryFilter.fileType = filters.fileType;
    }

    if (filters.knowledgeBaseId) {
      queryFilter.knowledgeBaseId = filters.knowledgeBaseId;
    }

    if (filters.search && filters.search.trim()) {
      const term = filters.search.trim();
      queryFilter.$or = [
        { displayName: { $regex: term, $options: 'i' } },
        { originalFilename: { $regex: term, $options: 'i' } },
      ];
    }

    return this.findAll(queryFilter, pagination);
  }

  async updateStatus(
    organizationId: string,
    id: string,
    targetStatus: DocumentProcessingStatus,
    progress?: number,
    errorMsg?: string | null,
  ): Promise<DocumentEntity> {
    const doc = await this.model.findOne({ _id: id, organizationId }).exec();
    if (!doc) {
      throw new AppError('Document not found.', HttpStatus.NOT_FOUND, 'DOCUMENT_NOT_FOUND', true);
    }

    if (!isValidStatusTransition(doc.processingStatus, targetStatus)) {
      throw new AppError(
        `Invalid status transition from ${doc.processingStatus} to ${targetStatus}.`,
        HttpStatus.BAD_REQUEST,
        'INVALID_DOCUMENT_STATE',
        true,
      );
    }

    doc.processingStatus = targetStatus;
    if (progress !== undefined) {
      doc.processingProgress = progress;
    }
    if (errorMsg !== undefined) {
      doc.processingError = errorMsg;
    }

    await doc.save();
    return this.toEntity(doc);
  }

  async findByChecksum(organizationId: string, checksum: string): Promise<DocumentEntity | null> {
    const doc = await this.model
      .findOne({ organizationId, checksum, deletedAt: null })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async softDeleteByOrg(organizationId: string, id: string): Promise<boolean> {
    const doc = await this.model.findOne({ _id: id, organizationId, deletedAt: null }).exec();
    if (!doc) return false;

    doc.processingStatus = DOCUMENT_PROCESSING_STATUS.DELETED;
    doc.deletedAt = new Date();
    await doc.save();
    return true;
  }
}

export const documentRepository = new DocumentRepository();
