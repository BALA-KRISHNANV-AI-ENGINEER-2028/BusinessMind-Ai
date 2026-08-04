/**
 * Documents Service — Placeholder. Phase 5: Full implementation.
 */

import { AppError } from '../../errors/AppError';
import { HttpStatus } from '../../constants/http.constants';
import type { IDocumentsService } from './documents.interface';
import type { Document, CreateDocumentDto, UpdateDocumentDto } from './documents.types';
import type { PaginationOptions, PaginationMeta } from '../../types/common.types';

const stub = (m: string) => new AppError(`DocumentsService.${m} not implemented (Phase 5).`, HttpStatus.NOT_IMPLEMENTED, 'NOT_IMPLEMENTED', true);

export class DocumentsService implements IDocumentsService {
  async getById(_id: string, _orgId: string): Promise<Document> { throw stub('getById'); }
  async getAll(_orgId: string, _p: PaginationOptions): Promise<{ data: Document[]; pagination: PaginationMeta }> { throw stub('getAll'); }
  async create(_data: CreateDocumentDto): Promise<Document> { throw stub('create'); }
  async update(_id: string, _data: UpdateDocumentDto): Promise<Document> { throw stub('update'); }
  async delete(_id: string, _orgId: string): Promise<void> { throw stub('delete'); }
}

export const documentsService = new DocumentsService();
