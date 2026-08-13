/**
 * AI Module — Request Validators.
 *
 * Phase 8: LLM Integration.
 * Validates the incoming POST /api/v1/ai/query request body.
 *
 * Security note:
 *   - organizationId and userId are NOT validated here — they come from JWT
 *   - knowledgeBaseId ownership is validated server-side in AiService
 *   - topK is bounded server-side in AiService (max: 10)
 */

import { z } from 'zod';

export const aiQuerySchema = z.object({
  body: z.object({
    /** The natural-language business question. Required. */
    query: z
      .string()
      .trim()
      .min(1, 'Query cannot be empty.')
      .max(2000, 'Query is too long (maximum 2000 characters).'),

    /**
     * Optional: restrict retrieval to a specific Knowledge Base.
     * If omitted, searches across all Knowledge Bases in the organization.
     * Ownership is validated server-side.
     */
    knowledgeBaseId: z
      .string()
      .trim()
      .min(1)
      .optional(),

    /**
     * Optional: number of evidence chunks to retrieve (1–10).
     * Defaults to server config (RETRIEVAL_TOP_K = 5).
     * Bounded server-side to max 10 for cost control.
     */
    topK: z
      .number()
      .int()
      .min(1, 'topK must be at least 1.')
      .max(10, 'topK cannot exceed 10.')
      .optional(),
  }),
});
