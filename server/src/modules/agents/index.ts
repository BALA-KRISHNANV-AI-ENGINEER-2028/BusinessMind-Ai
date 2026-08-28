/**
 * Agent Module — Bootstrap & Re-exports.
 *
 * Phase 10: Multi-Domain Specialized AI Agents.
 *
 * This file is the single entry point for the agents module.
 * It does two things:
 *
 *   1. REGISTERS all specialized agents with the AgentRegistry at startup.
 *      All agents are registered before the first HTTP request arrives.
 *
 *   2. RE-EXPORTS the public API of the agents module (router, registry, types)
 *      so that other modules (routes/index.ts) only need one import.
 *
 * Startup sequence:
 *   server.ts → app.ts → routes/index.ts → agents/index.ts (this file)
 *
 * Adding a new agent (Phase 11+):
 *   1. Create `agents/{domain}/{domain}.agent.ts` implementing IAgent
 *   2. Import it below and call: agentRegistry.register(agent);
 *   3. No other files need to change.
 *
 * Currently registered agents:
 *   ✓ SalesIntelligenceAgent     (Phase 9)  — id: "sales"
 *   ✓ FinanceIntelligenceAgent   (Phase 10) — id: "finance"
 *   ✓ CustomerIntelligenceAgent  (Phase 10) — id: "customer"
 *   ✓ InventoryIntelligenceAgent (Phase 10) — id: "inventory"
 *   ✓ MarketIntelligenceAgent    (Phase 10) — id: "market"
 *   ✓ RiskIntelligenceAgent      (Phase 10) — id: "risk"
 *   ✗ DecisionAgent              (Phase 11+)
 */

import { agentRegistry } from './agent.registry';
import { logger } from '../../config/logger.config';

// ── Phase 9: Sales Intelligence Agent ─────────────────────────────────────────
import { salesAgent } from './sales/sales.agent';

agentRegistry.register(salesAgent);

// ── Phase 10: Finance Intelligence Agent ──────────────────────────────────────
import { financeAgent } from './finance/finance.agent';

agentRegistry.register(financeAgent);

// ── Phase 10: Customer Intelligence Agent ─────────────────────────────────────
import { customerAgent } from './customer/customer.agent';

agentRegistry.register(customerAgent);

// ── Phase 10: Inventory Intelligence Agent ────────────────────────────────────
import { inventoryAgent } from './inventory/inventory.agent';

agentRegistry.register(inventoryAgent);

// ── Phase 10: Market Intelligence Agent ───────────────────────────────────────
import { marketAgent } from './market/market.agent';

agentRegistry.register(marketAgent);

// ── Phase 10: Risk Intelligence Agent ─────────────────────────────────────────
import { riskAgent } from './risk/risk.agent';

agentRegistry.register(riskAgent);

// ── Startup summary ────────────────────────────────────────────────────────────
logger.info(
  {
    registeredAgents: agentRegistry.list().map((a) => ({ id: a.id, version: a.version, domain: a.domain })),
    agentCount: agentRegistry.size,
  },
  '[Agents] Agent registry initialized.',
);

// ── Public exports ─────────────────────────────────────────────────────────────
export { agentsRouter } from './agent.routes';
export { agentRegistry } from './agent.registry';
export type { IAgent, AgentMetadata } from './agent.interface';
export type { AgentRequest, AgentResult, AgentFinding, AgentRisk, ConfidenceLevel } from './agent.types';
export type { AgentExecutionContext, AgentConfiguration } from './agent.execution.context';

