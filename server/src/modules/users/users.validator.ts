/**
 * Users Module — Validators.
 */

import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(100).optional(),
    jobTitle: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(30).optional(),
    bio: z.string().trim().max(500).optional(),
    avatarUrl: z.string().url('Must be a valid URL').optional(),
  }),
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    timezone: z.string().optional(),
    language: z.string().max(10).optional(),
    emailNotifications: z.boolean().optional(),
    marketingEmails: z.boolean().optional(),
  }),
});
