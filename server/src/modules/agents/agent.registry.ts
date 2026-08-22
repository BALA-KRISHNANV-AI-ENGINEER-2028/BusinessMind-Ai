/**
 * Agent Registry — Phase 9: Specialized Agentic AI Foundation.
 *
 * A Map-based registry that allows specialized agents to register themselves
 * at startup and be resolved by agentId at request time.
 *
 * Design decisions:
 *   - Map<string, IAgent> avoids if/else chains in the controller/service
 *   - Registration at startup (not request time) ensures fast lookup
 *   - Duplicate registration throws immediately (fail-fast at startup)
 *   - Exported as a singleton — one registry for the entire application
 *
 * Adding a new agent (Phase 10+):
 *   1. Implement IAgent in `agents/finance/finance.agent.ts`
 *   2. Import and register in `agents/index.ts`:
 *      `agentRegistry.register(financeAgent);`
 *   3. No changes needed here or in the controller/router.
 *
 * Thread safety note:
 *   The registry is populated during server startup (synchronous, single-threaded).
 *   After startup, only reads occur (resolve/list). This is safe for Node.js.
 */

import type { IAgent, AgentMetadata } from './agent.interface';
import { AgentNotFoundError } from './agent.errors';
import { logger } from '../../config/logger.config';

// ─── Agent Registry ───────────────────────────────────────────────────────────

export class AgentRegistry {
  private readonly agents = new Map<string, IAgent>();

  /**
   * Registers an agent with the registry.
   * Throws if an agent with the same ID is already registered.
   * Must be called during server startup, not during request handling.
   *
   * @param agent - An agent instance implementing IAgent.
   */
  register(agent: IAgent): void {
    const { id, name, version } = agent.metadata;

    if (this.agents.has(id)) {
      throw new Error(
        `[AgentRegistry] Agent "${id}" is already registered. ` +
        'Each agent ID must be unique. Check for duplicate registrations in agents/index.ts.',
      );
    }

    this.agents.set(id, agent);

    logger.info(
      { agentId: id, agentName: name, agentVersion: version },
      '[AgentRegistry] Agent registered.',
    );
  }

  /**
   * Resolves an agent by its ID.
   * Throws AgentNotFoundError (→ 404) if no agent is registered for the given ID.
   *
   * @param agentId - The agent identifier from the URL parameter.
   * @returns       - The registered IAgent instance.
   */
  resolve(agentId: string): IAgent {
    const agent = this.agents.get(agentId);

    if (!agent) {
      logger.warn(
        { agentId, registeredAgents: [...this.agents.keys()] },
        '[AgentRegistry] Agent not found.',
      );
      throw new AgentNotFoundError(agentId);
    }

    return agent;
  }

  /**
   * Returns metadata for all registered agents.
   * Used by GET /api/v1/agents to list available agents without exposing internals.
   */
  list(): AgentMetadata[] {
    return Array.from(this.agents.values()).map((agent) => agent.metadata);
  }

  /**
   * Checks if an agent with the given ID is registered.
   * Useful for conditional logic in tests or future orchestration.
   */
  has(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /**
   * Returns the count of registered agents.
   * Used in health checks and startup logging.
   */
  get size(): number {
    return this.agents.size;
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

/**
 * The global agent registry singleton.
 * Import this in `agents/index.ts` to register agents at startup.
 * Import this in AgentExecutionService to resolve agents at request time.
 */
export const agentRegistry = new AgentRegistry();
