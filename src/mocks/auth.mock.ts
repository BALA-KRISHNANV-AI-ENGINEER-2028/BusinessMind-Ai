import type { User, AuthSession } from '../types/auth';

export const mockUser: User = {
  id: 'usr_1',
  email: 'alex@businessmind.ai',
  fullName: 'Alex Rivera',
  avatarUrl: undefined,
  jobTitle: 'VP of Operations',
  phone: '+1 (555) 234-5678',
  bio: 'Leading strategic operations and cross-functional technology initiatives at Acme Inc.',
  defaultOrganizationId: 'org_1',
  preferences: {
    timezone: 'et',
    language: 'en-US',
    emailNotifications: true,
    marketingEmails: false,
  },
  createdAt: '2025-01-15T00:00:00Z',
};

export const mockSession: AuthSession = {
  user: mockUser,
  token: 'mock_jwt_access_token_businessmind_v3',
  refreshToken: 'mock_jwt_refresh_token_businessmind_v3',
  expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
  memberships: [
    { organizationId: 'org_1', organizationName: 'Acme Inc.', role: 'org_admin' },
    { organizationId: 'org_2', organizationName: 'Starlight Tech Solutions', role: 'analyst' },
    { organizationId: 'org_3', organizationName: 'Apex Ventures', role: 'employee' },
  ],
};
