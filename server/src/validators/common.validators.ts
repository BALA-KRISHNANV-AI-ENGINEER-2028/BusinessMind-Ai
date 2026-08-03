/**
 * Common Zod validators.
 *
 * Reusable Zod schemas and refinements shared across multiple module validators.
 * Import these building blocks rather than duplicating validation logic.
 *
 * @example
 * import { mongoIdSchema, paginationQuerySchema } from '@validators/common.validators';
 */

import { z } from 'zod';
import { PAGINATION } from '../constants/app.constants';
import { ROLES } from '../constants/app.constants';
import type { Role } from '../constants/app.constants';

// ─── MongoDB ObjectId ─────────────────────────────────────────────────────────

/**
 * Validates a MongoDB ObjectId string (24-char hexadecimal).
 */
export const mongoIdSchema = z
  .string({ required_error: 'ID is required' })
  .regex(/^[a-f\d]{24}$/i, 'Invalid ID format. Must be a 24-character hexadecimal string.');

// ─── UUID ─────────────────────────────────────────────────────────────────────

export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format.');

// ─── Pagination Query ─────────────────────────────────────────────────────────

/**
 * Validates and coerces pagination query string parameters.
 *
 * @example
 * // GET /api/v1/users?page=2&pageSize=25&sortBy=createdAt&sortDirection=desc
 */
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : PAGINATION.DEFAULT_PAGE))
    .pipe(z.number().int().min(1, 'Page must be at least 1')),

  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : PAGINATION.DEFAULT_PAGE_SIZE))
    .pipe(
      z.number()
        .int()
        .min(1, 'Page size must be at least 1')
        .max(PAGINATION.MAX_PAGE_SIZE, `Page size cannot exceed ${PAGINATION.MAX_PAGE_SIZE}`),
    ),

  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),

  search: z.string().trim().optional(),

  sortBy: z.string().trim().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// ─── Common Field Validators ──────────────────────────────────────────────────

export const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .email('Must be a valid email address')
  .toLowerCase();

export const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Password must contain at least one special character');

export const fullNameSchema = z
  .string({ required_error: 'Full name is required' })
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters');

export const slugSchema = z
  .string()
  .trim()
  .min(2, 'Slug must be at least 2 characters')
  .max(64, 'Slug must not exceed 64 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens');

// ─── Role Schema ──────────────────────────────────────────────────────────────

export const roleSchema = z.enum(
  Object.values(ROLES) as [Role, ...Role[]],
  { errorMap: () => ({ message: `Role must be one of: ${Object.values(ROLES).join(', ')}` }) },
);

// ─── URL Params with MongoDB ID ───────────────────────────────────────────────

export const idParamSchema = z.object({
  id: mongoIdSchema,
});

export type IdParam = z.infer<typeof idParamSchema>;
