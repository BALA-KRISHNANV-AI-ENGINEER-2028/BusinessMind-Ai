/**
 * Agent Interface — Phase 9: Specialized Agentic AI Foundation.
 *
 * Defines the contract every specialized agent MUST implement.
 *
 * Design principles:
 *   - Small surface area: 3 members only (metadata, canHandle, execute)
 *   - Provider-independent: agents depend on the ILLMProvider abstraction, not OpenAI directly
 *   - Domain-independent: the interface has no knowledge of sales, finance, etc.
 *   - Testable: pure interface — easy to mock in unit tests
 *   - Extensible: future agents implement IAgent without touching this file
 *
 * Adding a new agent (Phase 10+):
 *   1. Create `src/modules/agents/finance/finance.agent.ts` implementing IAgent
 *   2. Register it in `src/modules/agents/index.ts`
 *   3. No other files need to change.
 */

import type { AgentRequest, AgentResult } from './agent.types';
import type { AgentExecutionContext } from './agent.execution.context';

// ─── Agent Metadata ───────────────────────────────────────────────────────────

/**
 * Immutable metadata describing an agent's identity and capabilities.
 * Returned by GET /api/v1/agents and embedded in every AgentResult.
 */
export interface AgentMetadata {
  /**
   * Unique, stable agent identifier (kebab-case).
   * Used as the route parameter: POST /api/v1/agents/{id}/analyze
   * Example: "sales"
   */
  id: string;

  /** Human-readable display name. Example: "Sales Intelligence Agent" */
  name: string;

  /**
   * Short description of the agent's purpose and domain.
   * Displayed in the agent selection UI.
   */
  description: string;

  /**
   * Semantic version of this agent's prompt + logic.
   * Increment when the agent's behavior changes materially.
   * Example: "1.0.0"
   */
  version: string;

  /**
   * List of domain capabilities this agent supports.
   * Used for agent discovery and routing in future phases.
   * Example: ["sales-analysis", "sales-trends", "revenue-analysis"]
   */
  capabilities: string[];
}

// ─── Agent Interface ──────────────────────────────────────────────────────────

/**
 * The core contract for all specialized agents.
 *
 * Every agent:
 *   1. Declares its identity and capabilities via `metadata`
 *   2. Declares what queries it can handle via `canHandle()`
 *   3. Executes analysis against authorized evidence via `execute()`
 *
 * An agent is NOT:
 *   - A chatbot (it produces structured findings, not conversational text)
 *   - A general-purpose AI (it is domain-specialized)
 *   - A database writer (it produces analysis only — NO autonomous actions)
 *   - An orchestrator (orchestration belongs to a future Decision Agent)
 */
export interface IAgent {
  /**
   * Immutable metadata for this agent.
   * Used by the registry for discovery and by the controller for routing.
   */
  readonly metadata: AgentMetadata;

  /**
   * Determines whether this agent can handle the given request.
   *
   * For Phase 9, this is always `true` for matching agentId.
   * In future phases, this can gate on query content, capabilities, etc.
   *
   * @param request - The incoming agent request.
   * @returns       - true if the agent can process this request.
   */
  canHandle(request: AgentRequest): boolean;

  /**
   * Executes the agent's analysis pipeline and returns structured findings.
   *
   * The execution context contains all the information the agent needs:
   *   - organizationId (for tenant-isolated retrieval)
   *   - userId (for audit logging)
   *   - query (the business question)
   *   - knowledgeBaseId (optional scope restriction)
   *   - configuration (timeout, topK, token limits)
   *
   * The agent MUST:
   *   - Use only the retrieved evidence for factual claims
   *   - Distinguish facts from inferences
   *   - Report conflicting evidence rather than silently choosing one source
   *   - Return citations that map to real retrieved chunks
   *   - NOT perform autonomous business actions
   *   - NOT access the database directly (use service layer only)
   *
   * @param context - Execution context built by AgentExecutionService.
   * @returns       - Structured agent result with findings and evidence.
   * @throws        - AgentExecutionError on pipeline failure.
   */
  execute(context: AgentExecutionContext): Promise<AgentResult>;
}
