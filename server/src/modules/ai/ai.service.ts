/** AI Service — Placeholder. Phase 6+: AI integration. */
import { AppError } from '../../errors/AppError';
import { HttpStatus } from '../../constants/http.constants';
import type { IAiService } from './ai.interface';
import type { AiQueryDto, AiQueryResult, AgentStatus } from './ai.types';

const stub = (m: string) => new AppError(`AiService.${m} not implemented (Phase 6+).`, HttpStatus.NOT_IMPLEMENTED, 'NOT_IMPLEMENTED', true);

export class AiService implements IAiService {
  async query(_data: AiQueryDto): Promise<AiQueryResult> { throw stub('query'); }
  async getAgentStatuses(_orgId: string): Promise<AgentStatus[]> { throw stub('getAgentStatuses'); }
}
export const aiService = new AiService();
