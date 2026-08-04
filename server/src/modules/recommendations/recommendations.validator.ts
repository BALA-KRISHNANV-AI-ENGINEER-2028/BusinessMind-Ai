/** Recommendations Validators. */
import { z } from 'zod';
import { paginationQuerySchema } from '../../validators/common.validators';

export const listRecommendationsQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    category: z.string().optional(),
    riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  }),
});

export const dismissRecommendationSchema = z.object({
  body: z.object({
    reason: z.string().trim().max(255).optional(),
  }),
});
