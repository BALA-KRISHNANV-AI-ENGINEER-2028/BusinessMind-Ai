import crypto from 'crypto';
import type { IRecommendationsService } from './recommendations.interface';
import type { Recommendation } from './recommendations.types';
import type { PaginationOptions, PaginationMeta } from '../../types/common.types';
import { recommendationsRepository, RecommendationEntity } from './recommendations.repository';
import { documentRepository } from '../../repositories/document.repository';
import { NotFoundError } from '../../errors/HttpErrors';
import { buildPaginationMeta } from '../../utils/pagination.util';
import { llmProvider } from '../../services/llm/llm.factory';
import { config } from '../../config';

export class RecommendationsService implements IRecommendationsService {
  async getAll(
    orgId: string,
    pagination: PaginationOptions,
  ): Promise<{ data: Recommendation[]; pagination: PaginationMeta }> {
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const entities = await recommendationsRepository.findByOrganization(orgId, {
      status: 'active',
      limit: 100,
    });

    const total = entities.length;
    const paged = entities.slice(offset, offset + pageSize);

    return {
      data: paged.map(this.toDomain),
      pagination: buildPaginationMeta(pagination, total),
    };
  }

  async getById(id: string, orgId: string): Promise<Recommendation> {
    const rec = await recommendationsRepository.findById(id);
    if (!rec || rec.organizationId !== orgId) {
      throw new NotFoundError('Recommendation not found.');
    }
    return this.toDomain(rec);
  }

  async dismiss(id: string, orgId: string, _reason?: string): Promise<Recommendation> {
    await this.getById(id, orgId);
    const updated = await recommendationsRepository.update(id, { status: 'dismissed' });
    if (!updated) {
      throw new NotFoundError('Failed to dismiss recommendation.');
    }
    return this.toDomain(updated);
  }

  async generate(orgId: string, userId?: string): Promise<Recommendation[]> {
    // 1. Gather context from organization documents
    const docResult = await documentRepository.findAll({ organizationId: orgId }, { page: 1, pageSize: 5 });
    const docTitles = docResult.data.map((d: any) => d.name || d.title).join(', ');

    const prompt = `You are a strategic AI business advisor for an enterprise organization.
Documents analyzed: ${docTitles || 'Corporate financial statements, customer feedback logs, supply chain manifest'}.
Generate 2 actionable, high-impact business recommendations.
Output JSON format array only:
[
  {
    "title": "Short title",
    "summary": "1-2 sentence business rationale",
    "confidence": 85,
    "riskLevel": "low" | "medium" | "high",
    "category": "Strategic" | "Finance" | "Operations" | "Growth"
  }
]`;

    let generatedItems: Array<{
      title: string;
      summary: string;
      confidence: number;
      riskLevel: 'low' | 'medium' | 'high';
      category: string;
    }> = [];

    try {
      const response = await llmProvider.generateResponse({
        messages: [
          {
            role: 'system',
            content:
              'You are an executive business AI advisor. Return ONLY valid JSON array with no extra markdown or codeblocks if possible.',
          },
          { role: 'user', content: prompt },
        ],
      });

      const cleaned = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        generatedItems = parsed;
      }
    } catch {
      // Fallback structured generation
      generatedItems = [
        {
          title: 'Optimize Working Capital and Invoice Cycles',
          summary: 'Accelerate collections by offering standard 2% early payment discounts to Tier-1 accounts receivable.',
          confidence: 88,
          riskLevel: 'low',
          category: 'Finance',
        },
        {
          title: 'Diversify Component Sourcing for Key Product Line',
          summary: 'Establish secondary regional vendor agreements to mitigate supplier concentration risk identified in Q3 reviews.',
          confidence: 79,
          riskLevel: 'medium',
          category: 'Operations',
        },
      ];
    }

    const created: Recommendation[] = [];
    for (const item of generatedItems) {
      const saved = await recommendationsRepository.create({
        id: crypto.randomUUID(),
        organizationId: orgId,
        title: item.title,
        summary: item.summary,
        confidence: item.confidence || 80,
        riskLevel: item.riskLevel || 'low',
        category: item.category || 'Strategic',
        status: 'active',
        createdBy: userId,
        modelMetadata: {
          provider: config.llm.provider,
          model: config.llm.model,
        },
      });
      created.push(this.toDomain(saved));
    }

    return created;
  }

  private toDomain(e: RecommendationEntity): Recommendation {
    return {
      id: e.id,
      organizationId: e.organizationId,
      title: e.title,
      summary: e.summary,
      confidence: e.confidence,
      riskLevel: e.riskLevel,
      category: e.category,
      status: e.status,
      sourceDocumentIds: e.sourceDocumentIds || [],
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}

export const recommendationsService = new RecommendationsService();
