/** Settings Validators. */
import { z } from 'zod';

export const updateOrgSettingsSchema = z.object({
  body: z.object({
    allowMemberInvites: z.boolean().optional(),
    requireEmailVerification: z.boolean().optional(),
    sessionTimeoutMinutes: z.number().int().min(5).max(1440).optional(),
  }),
});
