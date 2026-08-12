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
    jobTitle: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    avatarUrl: z.string().trim().optional(),
    companyName: z
      .string({ required_error: 'Company name is required' })
      .trim()
      .min(2, 'Company name must be at least 2 characters')
      .max(100, 'Company name must not exceed 100 characters')
      .or(z.string().trim().min(2)),
    organizationName: z.string().trim().optional(),
    companyWebsite: z.string().trim().optional(),
    industry: z.string().trim().optional(),
    companySize: z.string().trim().optional(),
    companyDescription: z.string().trim().optional(),
    country: z.string().trim().optional(),
    timezone: z.string().trim().optional(),
  }),
});

// ─── Complete Onboarding ──────────────────────────────────────────────────────

export const completeOnboardingSchema = z.object({
  body: z.object({
    onboardingToken: z.string({ required_error: 'Onboarding token is required' }).min(1),
    fullName: fullNameSchema,
    jobTitle: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    companyName: z
      .string({ required_error: 'Company name is required' })
      .trim()
      .min(2, 'Company name must be at least 2 characters')
      .max(100, 'Company name must not exceed 100 characters'),
    companyWebsite: z.string().trim().optional(),
    industry: z.string().trim().optional(),
    companySize: z.string().trim().optional(),
    companyDescription: z.string().trim().optional(),
    country: z.string().trim().optional(),
    timezone: z.string().trim().optional(),
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
    refreshToken: z.string().optional(),
  }),
});

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export const googleOAuthSchema = z.object({
  body: z.object({
    code: z.string().optional(),
    idToken: z.string().optional(),
    redirectUri: z.string().optional(),
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
