/** Knowledge Base Validators. */
import { z } from 'zod';
import { paginationQuerySchema } from '../../validators/common.validators';

export const listKnowledgeItemsQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    category: z.string().optional(),
    status: z.enum(['active', 'archived', 'indexing']).optional(),
  }),
});

export const createKnowledgeItemSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1),
    category: z.string().trim().max(50).optional(),
    tags: z.array(z.string().trim().max(30)).optional(),
    sourceDocumentId: z.string().optional(),
  }),
});

export const updateKnowledgeItemSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().min(1).optional(),
    category: z.string().trim().max(50).optional(),
    tags: z.array(z.string().trim().max(30)).optional(),
    status: z.enum(['active', 'archived', 'indexing']).optional(),
  }),
});
