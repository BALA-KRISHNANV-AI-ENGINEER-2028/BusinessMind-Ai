/**
 * Document Version Repository.
 *
 * Mongoose repository for DocumentVersion history tracking.
 */

import { BaseRepository } from './base.repository';
import { DocumentVersionModel, IDocumentVersionDocument } from '../models/document-version.model';

export interface DocumentVersionEntity {
  id: string;
  documentId: string;
  organizationId: string;
  version: number;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  checksum: string;
  extractedTextLength: number;
  createdAt: string;
}

export type CreateDocumentVersionDto = Omit<
  DocumentVersionEntity,
  'id' | 'createdAt'
>;

export class DocumentVersionRepository extends BaseRepository<
  IDocumentVersionDocument,
  DocumentVersionEntity,
  CreateDocumentVersionDto,
  Partial<CreateDocumentVersionDto>
> {
  constructor() {
    super(DocumentVersionModel);
  }

  protected toEntity(doc: IDocumentVersionDocument): DocumentVersionEntity {
    const json = doc.toJSON() as Record<string, unknown>;
    return {
      id: String(json['id'] ?? json['_id']),
      documentId: String(json['documentId']),
      organizationId: String(json['organizationId']),
      version: Number(json['version']),
      fileSize: Number(json['fileSize']),
      mimeType: String(json['mimeType']),
      storageKey: String(json['storageKey']),
      checksum: String(json['checksum']),
      extractedTextLength: Number(json['extractedTextLength'] ?? 0),
      createdAt: json['createdAt'] ? new Date(json['createdAt'] as string).toISOString() : new Date().toISOString(),
    };
  }

  async findByDocumentId(
    organizationId: string,
    documentId: string,
  ): Promise<DocumentVersionEntity[]> {
    const docs = await this.model
      .find({ documentId, organizationId })
      .sort({ version: -1 })
      .exec();
    return docs.map((d) => this.toEntity(d));
  }

  async findLatestVersion(
    organizationId: string,
    documentId: string,
  ): Promise<DocumentVersionEntity | null> {
    const doc = await this.model
      .findOne({ documentId, organizationId })
      .sort({ version: -1 })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }
}

export const documentVersionRepository = new DocumentVersionRepository();
