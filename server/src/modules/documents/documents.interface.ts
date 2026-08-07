/**
 * Documents Module — Service Interface.
 */

import type { DocumentEntity } from '../../repositories/document.repository';
import type { UpdateDocumentInput, DocumentQueryInput } from './documents.types';
import type { PaginationMeta } from '../../types/common.types';
import type { Readable } from 'stream';

export interface IDocumentsService {
  upload(
    organizationId: string,
    userId: string,
    file: Express.Multer.File,
    knowledgeBaseId?: string,
  ): Promise<DocumentEntity>;
  getAll(
    organizationId: string,
    query: DocumentQueryInput,
  ): Promise<{ data: DocumentEntity[]; pagination: PaginationMeta }>;
  getById(organizationId: string, id: string): Promise<DocumentEntity>;
  update(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdateDocumentInput,
  ): Promise<DocumentEntity>;
  delete(organizationId: string, userId: string, id: string): Promise<void>;
  getStatus(
    organizationId: string,
    id: string,
  ): Promise<{
    id: string;
    processingStatus: string;
    processingProgress: number;
    processingError?: string | null;
  }>;
  getDownloadStream(
    organizationId: string,
    id: string,
  ): Promise<{ stream: Readable; doc: DocumentEntity }>;
  reprocess(organizationId: string, userId: string, id: string): Promise<DocumentEntity>;
}
