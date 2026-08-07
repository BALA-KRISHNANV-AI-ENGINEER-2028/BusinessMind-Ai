/**
 * Knowledge Base Repository.
 *
 * Mongoose repository for Knowledge Base management with strict organization isolation.
 */

import { BaseRepository } from './base.repository';
import { KnowledgeBaseModel, IKnowledgeBaseDocument } from '../models/knowledge-base.model';
import type { PaginationOptions, PaginationMeta } from '../types/common.types';
import type { FilterQuery } from 'mongoose';

export interface KnowledgeBaseEntity {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  isDefault: boolean;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type CreateKnowledgeBaseDto = Omit<
  KnowledgeBaseEntity,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'documentCount'
>;

export type UpdateKnowledgeBaseDto = Partial<
  Omit<KnowledgeBaseEntity, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>
>;

export class KnowledgeBaseRepository extends BaseRepository<
  IKnowledgeBaseDocument,
  KnowledgeBaseEntity,
  CreateKnowledgeBaseDto,
  UpdateKnowledgeBaseDto
> {
  constructor() {
    super(KnowledgeBaseModel);
  }

  protected toEntity(doc: IKnowledgeBaseDocument): KnowledgeBaseEntity {
    const json = doc.toJSON() as Record<string, unknown>;
    return {
      id: String(json['id'] ?? json['_id']),
      organizationId: String(json['organizationId']),
      name: String(json['name']),
      description: String(json['description'] ?? ''),
      isDefault: Boolean(json['isDefault']),
      documentCount: Number(json['documentCount'] ?? 0),
      createdAt: json['createdAt'] ? new Date(json['createdAt'] as string).toISOString() : new Date().toISOString(),
      updatedAt: json['updatedAt'] ? new Date(json['updatedAt'] as string).toISOString() : new Date().toISOString(),
      deletedAt: json['deletedAt'] ? new Date(json['deletedAt'] as string).toISOString() : null,
    };
  }

  async findByOrgAndId(organizationId: string, id: string): Promise<KnowledgeBaseEntity | null> {
    const doc = await this.model
      .findOne({ _id: id, organizationId, deletedAt: null })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findAllByOrg(
    organizationId: string,
    pagination: PaginationOptions,
    search?: string,
  ): Promise<{ data: KnowledgeBaseEntity[]; pagination: PaginationMeta }> {
    const filter: FilterQuery<IKnowledgeBaseDocument> = {
      organizationId,
      deletedAt: null,
    };

    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    return this.findAll(filter, pagination);
  }

  async findDefaultByOrg(organizationId: string): Promise<KnowledgeBaseEntity | null> {
    const doc = await this.model
      .findOne({ organizationId, isDefault: true, deletedAt: null })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async updateDocumentCount(id: string, delta: number): Promise<void> {
    await this.model
      .findByIdAndUpdate(id, { $inc: { documentCount: delta } })
      .exec();
  }

  async softDeleteByOrg(organizationId: string, id: string): Promise<boolean> {
    const res = await this.model
      .findOneAndUpdate(
        { _id: id, organizationId, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true },
      )
      .exec();
    return res !== null;
  }
}

export const knowledgeBaseRepository = new KnowledgeBaseRepository();
