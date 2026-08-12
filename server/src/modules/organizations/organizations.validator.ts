/**
 * Organizations Module — Validators.
 */

import { z } from 'zod';
import { paginationQuerySchema, roleSchema, slugSchema } from '../../validators/common.validators';

export const updateOrganizationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    domain: z.string().trim().max(100).optional(),
    logoUrl: z.string().url().optional(),
    website: z.string().trim().optional(),
    industry: z.string().trim().optional(),
    companySize: z.string().trim().optional(),
    description: z.string().trim().optional(),
    country: z.string().trim().optional(),
    timezone: z.string().trim().optional(),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Must be a valid email address').toLowerCase(),
    role: roleSchema,
  }),
});

export const updateMemberRoleSchema = z.object({
  body: z.object({ role: roleSchema }),
});

export const listMembersQuerySchema = z.object({
  query: paginationQuerySchema,
});
