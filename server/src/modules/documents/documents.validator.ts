/**
 * Documents Module — Zod Request Validators.
 */

import { z } from 'zod';

export const updateDocumentSchema = z.object({
  displayName: z.string().trim().min(1, 'Display name cannot be empty').max(200).optional(),
  knowledgeBaseId: z.string().uuid().nullable().optional(),
});

export const documentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  fileType: z.string().optional(),
  knowledgeBaseId: z.string().optional(),
  sortBy: z.enum(['displayName', 'createdAt', 'fileSize', 'processingStatus']).optional().default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const documentParamsSchema = z.object({
  id: z.string().uuid('Invalid document ID format'),
});
