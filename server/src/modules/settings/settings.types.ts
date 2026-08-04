/**
 * Settings Module — Types.
 * User and organisation-level settings.
 */

export interface OrgSettings {
  organizationId: string;
  allowMemberInvites: boolean;
  requireEmailVerification: boolean;
  sessionTimeoutMinutes: number;
  // Phase 6+: aiModelPreferences, ragSettings, webhooks
}

export interface UpdateOrgSettingsDto {
  allowMemberInvites?: boolean;
  requireEmailVerification?: boolean;
  sessionTimeoutMinutes?: number;
}

export interface SecuritySettings {
  mfaEnabled: boolean;
  activeSessions: number;
  // Phase 5+: lastPasswordChangedAt, trustedDevices
}
