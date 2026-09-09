import { BaseRepository } from '../../repositories/base.repository';
import {
  RecommendationModel,
  IRecommendationDocument,
  RiskLevel,
  RecommendationStatus,
  IEvidenceItem,
} from '../../models/recommendation.model';

export interface RecommendationEntity {
  id: string;
  organizationId: string;
  title: string;
  summary: string;
  description: string;
  confidence: number;
  riskLevel: RiskLevel;
  category: string;
  status: RecommendationStatus;
  evidence: IEvidenceItem[];
  sourceDocumentIds: string[];
  createdBy?: string;
  modelMetadata?: {
    provider?: string;
    model?: string;
    promptVersion?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecommendationDto {
  id?: string;
  organizationId: string;
  title: string;
  summary: string;
  description?: string;
  confidence: number;
  riskLevel?: RiskLevel;
  category?: string;
  status?: RecommendationStatus;
  evidence?: IEvidenceItem[];
  sourceDocumentIds?: string[];
  createdBy?: string;
  modelMetadata?: {
    provider?: string;
    model?: string;
    promptVersion?: string;
  };
}

export interface UpdateRecommendationDto {
  title?: string;
  summary?: string;
  description?: string;
  confidence?: number;
  riskLevel?: RiskLevel;
  category?: string;
  status?: RecommendationStatus;
}

export class RecommendationsRepository extends BaseRepository<
  IRecommendationDocument,
  RecommendationEntity,
  CreateRecommendationDto,
  UpdateRecommendationDto
> {
  constructor() {
    super(RecommendationModel);
  }

  protected toEntity(doc: IRecommendationDocument): RecommendationEntity {
    const json = doc.toJSON() as Record<string, unknown>;
    return {
      id: String(json['id'] ?? json['_id']),
      organizationId: String(json['organizationId']),
      title: String(json['title']),
      summary: String(json['summary']),
      description: String(json['description'] ?? ''),
      confidence: Number(json['confidence'] ?? 80),
      riskLevel: (json['riskLevel'] as RiskLevel) ?? 'low',
      category: String(json['category'] ?? 'Strategic'),
      status: (json['status'] as RecommendationStatus) ?? 'active',
      evidence: Array.isArray(json['evidence']) ? (json['evidence'] as IEvidenceItem[]) : [],
      sourceDocumentIds: Array.isArray(json['sourceDocumentIds']) ? (json['sourceDocumentIds'] as string[]) : [],
      createdBy: json['createdBy'] ? String(json['createdBy']) : undefined,
      modelMetadata: json['modelMetadata'] as RecommendationEntity['modelMetadata'],
      createdAt: json['createdAt'] ? new Date(json['createdAt'] as string).toISOString() : new Date().toISOString(),
      updatedAt: json['updatedAt'] ? new Date(json['updatedAt'] as string).toISOString() : new Date().toISOString(),
    };
  }

  async findByOrganization(
    organizationId: string,
    filters: { status?: RecommendationStatus; riskLevel?: RiskLevel; limit?: number } = {},
  ): Promise<RecommendationEntity[]> {
    const { status, riskLevel, limit = 50 } = filters;
    if (!this.isConnected()) {
      return Array.from(this.memoryStore.values())
        .filter((r) => {
          if (r.organizationId !== organizationId) return false;
          if (status && r.status !== status) return false;
          if (riskLevel && r.riskLevel !== riskLevel) return false;
          if (r.deletedAt) return false;
          return true;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    }

    const query: Record<string, unknown> = { organizationId, deletedAt: null };
    if (status) query['status'] = status;
    if (riskLevel) query['riskLevel'] = riskLevel;

    const docs = await this.model
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return docs.map((doc) => this.toEntity(doc));
  }
}

export const recommendationsRepository = new RecommendationsRepository();
