/**
 * Documents Module — Interface.
 */

import type { Document, CreateDocumentDto, UpdateDocumentDto } from './documents.types';
import type { PaginationOptions, PaginationMeta } from '../../types/common.types';

export interface IDocumentsService {
  getById(id: string, orgId: string): Promise<Document>;
  getAll(orgId: string, pagination: PaginationOptions): Promise<{ data: Document[]; pagination: PaginationMeta }>;
  create(data: CreateDocumentDto): Promise<Document>;
  update(id: string, data: UpdateDocumentDto): Promise<Document>;
  delete(id: string, orgId: string): Promise<void>;
  // Phase 5+: initiateProcessing(id: string): Promise<void>
  // Phase 6+: getUploadUrl(orgId: string, filename: string): Promise<string>
}
