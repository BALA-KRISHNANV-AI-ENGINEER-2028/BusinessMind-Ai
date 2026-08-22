/**
 * Agent Module — Request Validators.
 *
 * Phase 9: Specialized Agentic AI Foundation.
 * Validates the incoming POST /api/v1/agents/:agentId/analyze request body.
 *
 * Security note:
 *   - organizationId and userId are NOT validated here — they come from JWT
 *   - knowledgeBaseId ownership is validated in AgentExecutionService
 *   - agentId comes from URL params (validated separately by route structure)
 */

import { z } from 'zod';

// ─── Agent Analyze Schema ──────────────────────────────────────────────────────

export const agentAnalyzeSchema = z.object({
  body: z.object({
    /**
     * The user's natural-language business question.
     * Maximum 2000 characters to prevent abuse and excessive context assembly.
     */
    query: z
      .string()
      .trim()
      .min(1, 'Query cannot be empty.')
      .max(2000, 'Query is too long (maximum 2000 characters).'),

    /**
     * Optional: restrict retrieval to a specific Knowledge Base.
     * If omitted, the agent searches across all Knowledge Bases in the organization.
     * Ownership is validated server-side in AgentExecutionService.
     */
    knowledgeBaseId: z
      .string()
      .trim()
      .min(1)
      .optional(),
  }),

  /**
   * Route parameter validation: agentId must be a non-empty kebab-case string.
   * Example: "sales", "finance", "customer"
   */
  params: z.object({
    agentId: z
      .string()
      .trim()
      .min(1, 'Agent ID is required.')
      .max(64, 'Agent ID is too long.')
      .regex(
        /^[a-z0-9-]+$/,
        'Agent ID must contain only lowercase letters, numbers, and hyphens.',
      ),
  }),
});

export type AgentAnalyzeInput = z.infer<typeof agentAnalyzeSchema>;
