/**
 * Agent Routes — Phase 9: Specialized Agentic AI Foundation.
 *
 * Mounted at: /api/v1/agents
 *
 * Routes:
 *   GET  /api/v1/agents                    → list registered agents (any authenticated user)
 *   POST /api/v1/agents/:agentId/analyze   → execute agent (requires AI_AGENT_EXECUTE permission)
 *
 * Middleware chain for analyze:
 *   authenticate → aiLimiter → requirePermission(AI_AGENT_EXECUTE) → validate → controller
 *
 * Security:
 *   - authenticate: verifies JWT, populates req.user with organizationId from token
 *   - aiLimiter: 10 requests/minute per IP (same as /ai/query — agent calls cost similar)
 *   - requirePermission: analyst, manager, org_admin, super_admin only (not employee)
 *   - validate: Zod schema enforces request shape and agentId format
 */

import { Router } from 'express';
import { agentController } from './agent.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { aiLimiter } from '../../middlewares/rateLimiter.middleware';
import { agentAnalyzeSchema } from './agent.validator';
import { PERMISSIONS } from '../../constants/app.constants';

export const agentsRouter = Router();

// All agent routes require authentication
agentsRouter.use(authenticate);

/**
 * GET /api/v1/agents
 * Returns the list of registered agents and their capabilities.
 * No special permission required — any authenticated user can browse available agents.
 */
agentsRouter.get('/', agentController.listAgents);

/**
 * POST /api/v1/agents/:agentId/analyze
 * Executes a specialized agent analysis pipeline.
 * Requires the AI_AGENT_EXECUTE permission (analyst, manager, org_admin, super_admin).
 */
agentsRouter.post(
  '/:agentId/analyze',
  aiLimiter,
  requirePermission(PERMISSIONS.AI_AGENT_EXECUTE),
  validate(agentAnalyzeSchema),
  agentController.analyze,
);
