import { BaseRepository } from './base.repository';
import { AgentExecutionModel, IAgentExecutionDocument, AgentExecutionStatus } from '../models/agent-execution.model';

export interface AgentExecutionEntity {
  id: string;
  organizationId: string;
  agentId: string;
  status: AgentExecutionStatus;
  query: string;
  knowledgeBaseId?: string;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  result?: any;
  error?: string;
  createdBy: string;
  createdAt: string;
}

export class AgentExecutionRepository extends BaseRepository<
  IAgentExecutionDocument,
  AgentExecutionEntity,
  Partial<AgentExecutionEntity>,
  Partial<AgentExecutionEntity>
> {
  constructor() {
    super(AgentExecutionModel);
  }

  protected toEntity(doc: IAgentExecutionDocument): AgentExecutionEntity {
    const json = doc.toJSON() as Record<string, unknown>;
    return {
      id: String(json['id'] ?? json['_id']),
      organizationId: String(json['organizationId']),
      agentId: String(json['agentId']),
      status: json['status'] as AgentExecutionStatus,
      query: String(json['query']),
      knowledgeBaseId: json['knowledgeBaseId'] ? String(json['knowledgeBaseId']) : undefined,
      startedAt: json['startedAt'] ? new Date(json['startedAt'] as string).toISOString() : new Date().toISOString(),
      completedAt: json['completedAt'] ? new Date(json['completedAt'] as string).toISOString() : undefined,
      durationMs: Number(json['durationMs'] ?? 0),
      result: json['result'],
      error: json['error'] ? String(json['error']) : undefined,
      createdBy: String(json['createdBy'] ?? 'system'),
      createdAt: json['createdAt'] ? new Date(json['createdAt'] as string).toISOString() : new Date().toISOString(),
    };
  }

  async findByOrg(organizationId: string, limit: number = 20): Promise<AgentExecutionEntity[]> {
    if (!this.isConnected()) {
      return Array.from(this.memoryStore.values())
        .filter((e) => e.organizationId === organizationId && !e.deletedAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    }
    const docs = await this.model
      .find({ organizationId, deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map((d) => this.toEntity(d));
  }

  async findLatestByAgent(organizationId: string, agentId: string): Promise<AgentExecutionEntity | null> {
    if (!this.isConnected()) {
      const matches = Array.from(this.memoryStore.values())
        .filter((e) => e.organizationId === organizationId && e.agentId === agentId && !e.deletedAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return matches[0] || null;
    }
    const doc = await this.model
      .findOne({ organizationId, agentId, deletedAt: null })
      .sort({ createdAt: -1 })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }
}

export const agentExecutionRepository = new AgentExecutionRepository();
