/**
 * Documents Module — Validators.
 */

import { z } from 'zod';
import { paginationQuerySchema } from '../../validators/common.validators';
import { FILE_UPLOAD } from '../../constants/app.constants';

export const listDocumentsQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    category: z.string().optional(),
    status: z.enum(['processed', 'processing', 'failed']).optional(),
  }),
});

export const updateDocumentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(255).optional(),
    category: z.string().trim().max(50).optional(),
    tags: z.array(z.string().trim().max(30)).max(10).optional(),
  }),
});

// Note: File upload validation (MIME type, size) is handled by Multer middleware in Phase 6+
