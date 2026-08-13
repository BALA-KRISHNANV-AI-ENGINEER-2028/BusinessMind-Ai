/** AI Module — Interface. Phase 8: LLM Integration. */
import type { AiQueryDto, AiQueryResult, AgentStatus } from './ai.types';

export interface IAiService {
  /**
   * Processes a business intelligence query through the RAG + LLM pipeline.
   *
   * Pipeline:
   *   1. Validate Knowledge Base access
   *   2. Retrieve evidence via RetrievalService
   *   3. Check evidence sufficiency
   *   4. Build LLM context
   *   5. Build prompt messages
   *   6. Generate LLM response
   *   7. Validate + sanitize response
   *   8. Map citations to sources
   *   9. Audit log
   *
   * @throws AppError on authorization failure, retrieval failure, or LLM provider failure.
   */
  query(data: AiQueryDto): Promise<AiQueryResult>;

  /**
   * Returns agent statuses for the organization.
   * Phase 8: stub — agents are implemented in Phase 9+.
   */
  getAgentStatuses(orgId: string): Promise<AgentStatus[]>;
}
