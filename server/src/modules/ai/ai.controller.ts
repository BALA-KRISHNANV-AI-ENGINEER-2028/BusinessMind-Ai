/**
 * AI Controller — Phase 8: LLM Integration.
 *
 * Handles HTTP request/response for POST /api/v1/ai/query.
 *
 * Security contract:
 *   - organizationId and userId are ALWAYS sourced from req.user (verified JWT)
 *   - They are NEVER trusted from the request body
 *   - The controller only reads from req.body what the validator has sanitized
 */

import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async.util';
import { sendSuccess } from '../../utils/response.util';
import { aiService } from './ai.service';

export const aiController = {
  /**
   * POST /api/v1/ai/query
   *
   * Processes a business intelligence query through the RAG + LLM pipeline.
   * Returns a grounded answer with evidence citations.
   */
  query: asyncHandler(async (req: Request, res: Response) => {
    const { query, knowledgeBaseId, topK } = req.body as {
      query: string;
      knowledgeBaseId?: string;
      topK?: number;
    };

    const result = await aiService.query({
      query,
      knowledgeBaseId,
      topK,
      // Always from verified JWT — never from client body
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
    });

    sendSuccess(res, result);
  }),

  /**
   * GET /api/v1/ai/agents/status
   *
   * Returns agent statuses for the organization.
   * Phase 8: returns empty array (agents implemented in Phase 9+).
   */
  getAgentStatuses: asyncHandler(async (req: Request, res: Response) => {
    const statuses = await aiService.getAgentStatuses(req.user!.organizationId);
    sendSuccess(res, statuses);
  }),
};
