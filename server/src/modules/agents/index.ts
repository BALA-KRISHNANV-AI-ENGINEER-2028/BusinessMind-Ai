/**
 * Agent Module — Bootstrap & Re-exports.
 *
 * Phase 9: Specialized Agentic AI Foundation.
 *
 * This file is the single entry point for the agents module.
 * It does two things:
 *
 *   1. REGISTERS all specialized agents with the AgentRegistry at startup.
 *      Add new agents here as they are implemented in later phases.
 *
 *   2. RE-EXPORTS the public API of the agents module (router, registry, types)
 *      so that other modules (routes/index.ts) only need one import.
 *
 * Startup sequence:
 *   server.ts → app.ts → routes/index.ts → agents/index.ts (this file)
 *   At this point, all agents are registered before the first HTTP request arrives.
 *
 * Adding a new agent (Phase 10+):
 *   1. Create `agents/finance/finance.agent.ts` implementing IAgent
 *   2. Import it below and call: agentRegistry.register(financeAgent);
 *   3. No other files need to change.
 *
 * Currently registered agents:
 *   ✓ SalesIntelligenceAgent   (Phase 9)
 *   ✗ FinanceAgent             (Phase 10+)
 *   ✗ CustomerAgent            (Phase 10+)
 *   ✗ InventoryAgent           (Phase 10+)
 *   ✗ RiskAgent                (Phase 10+)
 *   ✗ DecisionAgent            (Phase 11+)
 */

import { agentRegistry } from './agent.registry';
import { logger } from '../../config/logger.config';

// ── Phase 9: Register Sales Intelligence Agent ─────────────────────────────
import { salesAgent } from './sales/sales.agent';

agentRegistry.register(salesAgent);

// ── Future phases: register additional agents here ─────────────────────────
// import { financeAgent } from './finance/finance.agent';
// agentRegistry.register(financeAgent);

// ── Startup summary ────────────────────────────────────────────────────────
logger.info(
  {
    registeredAgents: agentRegistry.list().map((a) => ({ id: a.id, version: a.version })),
    agentCount: agentRegistry.size,
  },
  '[Agents] Agent registry initialized.',
);

// ── Public exports ─────────────────────────────────────────────────────────
export { agentsRouter } from './agent.routes';
export { agentRegistry } from './agent.registry';
export type { IAgent, AgentMetadata } from './agent.interface';
export type { AgentRequest, AgentResult, AgentFinding, AgentRisk, ConfidenceLevel } from './agent.types';
export type { AgentExecutionContext, AgentConfiguration } from './agent.execution.context';
