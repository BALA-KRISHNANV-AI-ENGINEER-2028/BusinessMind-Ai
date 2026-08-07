/**
 * Knowledge Base Module — Zod Request Validators.
 */

import { z } from 'zod';

export const createKnowledgeBaseSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
  isDefault: z.boolean().optional(),
});

export const updateKnowledgeBaseSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  isDefault: z.boolean().optional(),
});

export const addDocumentToKBSchema = z.object({
  documentId: z.string().uuid('Invalid document ID format'),
});

export const knowledgeBaseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'documentCount']).optional().default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const knowledgeBaseParamsSchema = z.object({
  id: z.string().uuid('Invalid knowledge base ID format'),
});
