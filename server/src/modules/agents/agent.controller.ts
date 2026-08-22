/**
 * Agent Controller — Phase 9: Specialized Agentic AI Foundation.
 *
 * Handles HTTP request/response for the agents API:
 *   POST /api/v1/agents/:agentId/analyze  — Execute a specialized agent
 *   GET  /api/v1/agents                    — List available agents
 *
 * Security contract:
 *   - organizationId and userId are ALWAYS sourced from req.user (verified JWT)
 *   - They are NEVER trusted from the request body
 *   - agentId comes from the URL parameter (validated by agentAnalyzeSchema)
 *   - knowledgeBaseId ownership is validated in AgentExecutionService, not here
 *
 * The controller is intentionally thin:
 *   - Extracts and type-asserts validated request data
 *   - Delegates to AgentExecutionService for all business logic
 *   - Formats the response using the standard sendSuccess envelope
 */

import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async.util';
import { sendSuccess } from '../../utils/response.util';
import { agentExecutionService } from './agent.execution.service';
import { agentRegistry } from './agent.registry';

export const agentController = {
  /**
   * POST /api/v1/agents/:agentId/analyze
   *
   * Executes a specialized agent analysis pipeline.
   * Returns structured findings backed by evidence citations.
   *
   * Authorization:
   *   - Requires valid JWT (authenticate middleware)
   *   - Requires PERMISSIONS.AI_AGENT_EXECUTE permission
   *
   * Rate limited by aiLimiter (10 requests/minute per IP).
   */
  analyze: asyncHandler(async (req: Request, res: Response) => {
    const { agentId } = req.params as { agentId: string };
    const { query, knowledgeBaseId } = req.body as {
      query: string;
      knowledgeBaseId?: string;
    };

    const result = await agentExecutionService.execute(
      {
        agentId,
        query,
        knowledgeBaseId,
        // Always from verified JWT — never from client body
        organizationId: req.user!.organizationId,
        userId: req.user!.id,
        requestId: req.requestId,
      },
      {
        email: req.user!.email,
        role: req.user!.role,
        permissions: req.user!.permissions as string[],
      },
    );

    sendSuccess(res, result);
  }),

  /**
   * GET /api/v1/agents
   *
   * Returns the list of available agents and their capabilities.
   * Does not require the AI_AGENT_EXECUTE permission — read-only listing.
   * Any authenticated user can see what agents are available.
   */
  listAgents: asyncHandler(async (_req: Request, res: Response) => {
    const agents = agentRegistry.list();
    sendSuccess(res, agents);
  }),
};
