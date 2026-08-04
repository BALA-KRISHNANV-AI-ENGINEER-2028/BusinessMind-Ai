/**
 * Auth Module — Validators.
 *
 * Zod schemas for all authentication request bodies.
 * Used with the validate() middleware in auth.routes.ts.
 */

import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  fullNameSchema,
} from '../../validators/common.validators';

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    fullName: fullNameSchema,
    organizationName: z
      .string()
      .trim()
      .min(2, 'Organisation name must be at least 2 characters')
      .max(100, 'Organisation name must not exceed 100 characters')
      .optional(),
  }),
});

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  }),
});

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: 'Refresh token is required' }).min(1),
  }),
});

// ─── Change Password ──────────────────────────────────────────────────────────

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string({ required_error: 'Current password is required' }).min(1),
      newPassword: passwordSchema,
      confirmPassword: z.string({ required_error: 'Confirm password is required' }).min(1),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: 'New password must differ from current password',
      path: ['newPassword'],
    }),
});

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z.string({ required_error: 'Reset token is required' }).min(1),
      newPassword: passwordSchema,
      confirmPassword: z.string({ required_error: 'Confirm password is required' }).min(1),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});
