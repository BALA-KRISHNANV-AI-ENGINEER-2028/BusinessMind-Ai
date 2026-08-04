/** Knowledge Base Module — Interface. */
import type { KnowledgeItem, CreateKnowledgeItemDto, UpdateKnowledgeItemDto } from './knowledge-base.types';
import type { PaginationOptions, PaginationMeta } from '../../types/common.types';
export interface IKnowledgeBaseService {
  getById(id: string, orgId: string): Promise<KnowledgeItem>;
  getAll(orgId: string, pagination: PaginationOptions): Promise<{ data: KnowledgeItem[]; pagination: PaginationMeta }>;
  create(data: CreateKnowledgeItemDto & { organizationId: string }): Promise<KnowledgeItem>;
  update(id: string, data: UpdateKnowledgeItemDto): Promise<KnowledgeItem>;
  delete(id: string, orgId: string): Promise<void>;
}
