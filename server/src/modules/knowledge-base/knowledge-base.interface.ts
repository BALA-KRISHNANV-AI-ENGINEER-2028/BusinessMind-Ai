/**
 * Knowledge Base Module — Service Interface.
 */

import type { KnowledgeBaseEntity } from '../../repositories/knowledge-base.repository';
import type { DocumentEntity } from '../../repositories/document.repository';
import type {
  CreateKnowledgeBaseInput,
  UpdateKnowledgeBaseInput,
  KnowledgeBaseQueryInput,
} from './knowledge-base.types';
import type { PaginationMeta } from '../../types/common.types';

export interface IKnowledgeBaseService {
  create(
    organizationId: string,
    userId: string,
    input: CreateKnowledgeBaseInput,
  ): Promise<KnowledgeBaseEntity>;
  getAll(
    organizationId: string,
    query: KnowledgeBaseQueryInput,
  ): Promise<{ data: KnowledgeBaseEntity[]; pagination: PaginationMeta }>;
  getById(organizationId: string, id: string): Promise<KnowledgeBaseEntity>;
  update(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdateKnowledgeBaseInput,
  ): Promise<KnowledgeBaseEntity>;
  delete(organizationId: string, userId: string, id: string): Promise<void>;
  addDocument(
    organizationId: string,
    userId: string,
    kbId: string,
    documentId: string,
  ): Promise<DocumentEntity>;
  removeDocument(
    organizationId: string,
    userId: string,
    kbId: string,
    documentId: string,
  ): Promise<DocumentEntity>;
  getKBDocuments(
    organizationId: string,
    kbId: string,
    query: { page?: number; pageSize?: number },
  ): Promise<{ data: DocumentEntity[]; pagination: PaginationMeta }>;
}
