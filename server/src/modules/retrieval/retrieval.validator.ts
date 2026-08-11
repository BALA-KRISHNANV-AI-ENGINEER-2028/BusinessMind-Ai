/**
 * Retrieval Module — Zod Request Validators.
 */

import { z } from 'zod';

export const searchEvidenceSchema = z.object({
  query: z
    .string({ required_error: 'Query string is required' })
    .min(1, 'Query string cannot be empty')
    .max(1000, 'Query string cannot exceed 1000 characters'),

  knowledgeBaseId: z.string().uuid('Invalid knowledgeBaseId format').optional(),
  documentId: z.string().optional(),
  documentVersionId: z.string().optional(),

  topK: z
    .number()
    .int('topK must be an integer')
    .min(1, 'topK must be at least 1')
    .max(20, 'topK cannot exceed 20')
    .optional(),

  minScore: z
    .number()
    .min(0.0, 'minScore must be at least 0.0')
    .max(1.0, 'minScore cannot exceed 1.0')
    .optional(),
});

export type SearchEvidenceSchemaType = z.infer<typeof searchEvidenceSchema>;
