/** AI Module — Interface. */
import type { AiQueryDto, AiQueryResult, AgentStatus } from './ai.types';
export interface IAiService {
  query(data: AiQueryDto): Promise<AiQueryResult>;
  getAgentStatuses(orgId: string): Promise<AgentStatus[]>;
  // Phase 6+: streamQuery, runAgent, stopAgent
}
