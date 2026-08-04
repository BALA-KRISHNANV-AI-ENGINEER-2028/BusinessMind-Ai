/** AI Validators. */
import { z } from 'zod';

export const aiQuerySchema = z.object({
  body: z.object({
    query: z.string().trim().min(1, 'Query cannot be empty'),
    threadId: z.string().optional(),
  }),
});
