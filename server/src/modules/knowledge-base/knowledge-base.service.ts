/**
 * Knowledge Base Service.
 *
 * Implements business logic for organization knowledge base management.
 */

import { knowledgeBaseRepository, KnowledgeBaseEntity } from '../../repositories/knowledge-base.repository';
import { documentRepository, DocumentEntity } from '../../repositories/document.repository';
import type {
  CreateKnowledgeBaseInput,
  UpdateKnowledgeBaseInput,
  KnowledgeBaseQueryInput,
} from './knowledge-base.types';
import type { PaginationMeta } from '../../types/common.types';
import { AppError } from '../../errors/AppError';
import { HttpStatus } from '../../constants/http.constants';
import { auditLogService } from '../../services/auditLog.service';

export class KnowledgeBaseService {
  async create(
    organizationId: string,
    userId: string,
    input: CreateKnowledgeBaseInput,
  ): Promise<KnowledgeBaseEntity> {
    const existing = await knowledgeBaseRepository.findAllByOrg(
      organizationId,
      { page: 1, pageSize: 1 },
    );

    const isFirstKB = existing.pagination.total === 0;

    const kb = await knowledgeBaseRepository.create({
      organizationId,
      name: input.name,
      description: input.description ?? '',
      isDefault: input.isDefault ?? isFirstKB,
    });

    await auditLogService.log({
      organizationId,
      userId,
      action: 'knowledge_base:create',
      resource: 'knowledge_base',
      resourceId: kb.id,
      details: { name: kb.name },
    });

    return kb;
  }

  async getAll(
    organizationId: string,
    query: KnowledgeBaseQueryInput,
  ): Promise<{ data: KnowledgeBaseEntity[]; pagination: PaginationMeta }> {
    return knowledgeBaseRepository.findAllByOrg(
      organizationId,
      {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 10,
        sortBy: query.sortBy ?? 'createdAt',
        sortDirection: query.sortDirection ?? 'desc',
      },
      query.search,
    );
  }

  async getById(organizationId: string, id: string): Promise<KnowledgeBaseEntity> {
    const kb = await knowledgeBaseRepository.findByOrgAndId(organizationId, id);
    if (!kb) {
      throw new AppError(
        'Knowledge base not found.',
        HttpStatus.NOT_FOUND,
        'KNOWLEDGE_BASE_NOT_FOUND',
        true,
      );
    }
    return kb;
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdateKnowledgeBaseInput,
  ): Promise<KnowledgeBaseEntity> {
    await this.getById(organizationId, id);

    const updated = await knowledgeBaseRepository.update(id, input);
    if (!updated) {
      throw new AppError(
        'Failed to update knowledge base.',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'UPDATE_FAILED',
        false,
      );
    }

    await auditLogService.log({
      organizationId,
      userId,
      action: 'knowledge_base:update',
      resource: 'knowledge_base',
      resourceId: id,
      details: { updates: input },
    });

    return updated;
  }

  async delete(organizationId: string, userId: string, id: string): Promise<void> {
    const kb = await this.getById(organizationId, id);

    const success = await knowledgeBaseRepository.softDeleteByOrg(organizationId, id);
    if (!success) {
      throw new AppError(
        'Failed to delete knowledge base.',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'DELETE_FAILED',
        false,
      );
    }

    await auditLogService.log({
      organizationId,
      userId,
      action: 'knowledge_base:delete',
      resource: 'knowledge_base',
      resourceId: id,
      details: { name: kb.name },
    });
  }

  async addDocument(
    organizationId: string,
    userId: string,
    kbId: string,
    documentId: string,
  ): Promise<DocumentEntity> {
    await this.getById(organizationId, kbId);

    const doc = await documentRepository.findByOrgAndId(organizationId, documentId);
    if (!doc) {
      throw new AppError(
        'Document not found in organization.',
        HttpStatus.NOT_FOUND,
        'DOCUMENT_NOT_FOUND',
        true,
      );
    }

    const updatedDoc = await documentRepository.update(documentId, {
      knowledgeBaseId: kbId,
    });

    if (!updatedDoc) {
      throw new AppError('Failed to link document.', HttpStatus.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', false);
    }

    await knowledgeBaseRepository.updateDocumentCount(kbId, 1);

    await auditLogService.log({
      organizationId,
      userId,
      action: 'knowledge_base:add_document',
      resource: 'knowledge_base',
      resourceId: kbId,
      details: { documentId },
    });

    return updatedDoc;
  }

  async removeDocument(
    organizationId: string,
    userId: string,
    kbId: string,
    documentId: string,
  ): Promise<DocumentEntity> {
    await this.getById(organizationId, kbId);

    const doc = await documentRepository.findByOrgAndId(organizationId, documentId);
    if (!doc || doc.knowledgeBaseId !== kbId) {
      throw new AppError(
        'Document is not assigned to this knowledge base.',
        HttpStatus.NOT_FOUND,
        'DOCUMENT_NOT_IN_KB',
        true,
      );
    }

    const updatedDoc = await documentRepository.update(documentId, {
      knowledgeBaseId: null,
    });

    if (!updatedDoc) {
      throw new AppError('Failed to remove document.', HttpStatus.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', false);
    }

    await knowledgeBaseRepository.updateDocumentCount(kbId, -1);

    await auditLogService.log({
      organizationId,
      userId,
      action: 'knowledge_base:remove_document',
      resource: 'knowledge_base',
      resourceId: kbId,
      details: { documentId },
    });

    return updatedDoc;
  }

  async getKBDocuments(
    organizationId: string,
    kbId: string,
    query: { page?: number; pageSize?: number },
  ): Promise<{ data: DocumentEntity[]; pagination: PaginationMeta }> {
    await this.getById(organizationId, kbId);

    return documentRepository.findAllByOrg(
      organizationId,
      {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 10,
      },
      { knowledgeBaseId: kbId },
    );
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
