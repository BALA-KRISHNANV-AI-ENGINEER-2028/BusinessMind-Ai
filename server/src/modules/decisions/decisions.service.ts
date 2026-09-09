import crypto from 'crypto';
import { decisionRepository, DecisionEntity, CreateDecisionDto, UpdateDecisionDto } from '../../repositories/decision.repository';
import { NotFoundError } from '../../errors/HttpErrors';

export class DecisionsService {
  async getAll(
    organizationId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<DecisionEntity[]> {
    return decisionRepository.findByOrganization(organizationId, options);
  }

  async getRecent(
    organizationId: string,
    limit: number = 5,
  ): Promise<Array<{ id: string; title: string; dateLabel: string; owner: string; outcome: 'approved' | 'rejected' | 'pending' }>> {
    const decisions = await decisionRepository.findByOrganization(organizationId, { limit });
    return decisions.map((d) => ({
      id: d.id,
      title: d.title,
      dateLabel: new Date(d.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      owner: d.owner || 'Alex Rivera',
      outcome: d.outcome || 'pending',
    }));
  }

  async getById(id: string, organizationId: string): Promise<DecisionEntity> {
    const decision = await decisionRepository.findById(id);
    if (!decision || decision.organizationId !== organizationId) {
      throw new NotFoundError('Decision not found.');
    }
    return decision;
  }

  async create(
    organizationId: string,
    userId: string,
    data: {
      title: string;
      description?: string;
      owner?: string;
      category?: string;
      status?: 'pending' | 'in_progress' | 'implemented' | 'archived' | 'approved' | 'rejected';
      outcome?: 'approved' | 'rejected' | 'pending';
      source?: string;
      isAiGenerated?: boolean;
    },
  ): Promise<DecisionEntity> {
    const dto: CreateDecisionDto = {
      id: crypto.randomUUID(),
      organizationId,
      createdBy: userId,
      title: data.title,
      description: data.description || '',
      owner: data.owner || 'BusinessMind User',
      category: data.category || 'Operations',
      status: data.status || 'pending',
      outcome: data.outcome || 'pending',
      source: data.source || 'Manual',
      isAiGenerated: Boolean(data.isAiGenerated),
    };
    return decisionRepository.create(dto);
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateDecisionDto,
  ): Promise<DecisionEntity> {
    await this.getById(id, organizationId);
    const updated = await decisionRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Decision not found for update.');
    }
    return updated;
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.getById(id, organizationId);
    await decisionRepository.delete(id);
  }
}

export const decisionsService = new DecisionsService();
