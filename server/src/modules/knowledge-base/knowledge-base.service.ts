/** Knowledge Base Service — Placeholder. Phase 5: Implementation. */
import { AppError } from '../../errors/AppError';
import { HttpStatus } from '../../constants/http.constants';
import type { IKnowledgeBaseService } from './knowledge-base.interface';
import type { KnowledgeItem, CreateKnowledgeItemDto, UpdateKnowledgeItemDto } from './knowledge-base.types';
import type { PaginationOptions, PaginationMeta } from '../../types/common.types';

const stub = (m: string) => new AppError(`KnowledgeBaseService.${m} not implemented (Phase 5).`, HttpStatus.NOT_IMPLEMENTED, 'NOT_IMPLEMENTED', true);

export class KnowledgeBaseService implements IKnowledgeBaseService {
  async getById(_id: string, _orgId: string): Promise<KnowledgeItem> { throw stub('getById'); }
  async getAll(_orgId: string, _p: PaginationOptions): Promise<{ data: KnowledgeItem[]; pagination: PaginationMeta }> { throw stub('getAll'); }
  async create(_d: CreateKnowledgeItemDto & { organizationId: string }): Promise<KnowledgeItem> { throw stub('create'); }
  async update(_id: string, _d: UpdateKnowledgeItemDto): Promise<KnowledgeItem> { throw stub('update'); }
  async delete(_id: string, _orgId: string): Promise<void> { throw stub('delete'); }
}
export const knowledgeBaseService = new KnowledgeBaseService();
