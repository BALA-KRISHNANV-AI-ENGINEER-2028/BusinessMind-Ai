import { BaseRepository } from './base.repository';
import { DecisionModel, IDecisionDocument, DecisionStatus, DecisionOutcome } from '../models/decision.model';

export interface DecisionEntity {
  id: string;
  organizationId: string;
  createdBy: string;
  title: string;
  description: string;
  status: DecisionStatus;
  outcome: DecisionOutcome;
  category: string;
  owner: string;
  source?: string;
  isAiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDecisionDto {
  id?: string;
  organizationId: string;
  createdBy: string;
  title: string;
  description?: string;
  status?: DecisionStatus;
  outcome?: DecisionOutcome;
  category?: string;
  owner: string;
  source?: string;
  isAiGenerated?: boolean;
}

export interface UpdateDecisionDto {
  title?: string;
  description?: string;
  status?: DecisionStatus;
  outcome?: DecisionOutcome;
  category?: string;
  owner?: string;
  source?: string;
}

export class DecisionRepository extends BaseRepository<
  IDecisionDocument,
  DecisionEntity,
  CreateDecisionDto,
  UpdateDecisionDto
> {
  constructor() {
    super(DecisionModel);
  }

  protected toEntity(doc: IDecisionDocument): DecisionEntity {
    const json = doc.toJSON() as Record<string, unknown>;
    return {
      id: String(json['id'] ?? json['_id']),
      organizationId: String(json['organizationId']),
      createdBy: String(json['createdBy']),
      title: String(json['title']),
      description: String(json['description'] ?? ''),
      status: json['status'] as DecisionStatus,
      outcome: json['outcome'] as DecisionOutcome,
      category: String(json['category'] ?? 'General'),
      owner: String(json['owner']),
      source: json['source'] ? String(json['source']) : undefined,
      isAiGenerated: Boolean(json['isAiGenerated']),
      createdAt: json['createdAt'] ? new Date(json['createdAt'] as string).toISOString() : new Date().toISOString(),
      updatedAt: json['updatedAt'] ? new Date(json['updatedAt'] as string).toISOString() : new Date().toISOString(),
    };
  }

  async findByOrganization(
    organizationId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<DecisionEntity[]> {
    const { limit = 50, offset = 0 } = options;
    if (!this.isConnected()) {
      return Array.from(this.memoryStore.values())
        .filter((d) => d.organizationId === organizationId && !d.deletedAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(offset, offset + limit);
    }
    const docs = await this.model
      .find({ organizationId, deletedAt: null })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec();
    return docs.map((doc) => this.toEntity(doc));
  }
}

export const decisionRepository = new DecisionRepository();
