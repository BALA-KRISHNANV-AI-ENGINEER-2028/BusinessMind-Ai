/**
 * Organization and Multi-Tenancy type definitions.
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  domain?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  description?: string;
  country?: string;
  timezone?: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  memberCount: number;
}

export type OrgMemberRole = 'super_admin' | 'org_admin' | 'manager' | 'analyst' | 'employee';

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: OrgMemberRole;
  jobTitle?: string;
  joinedAt: string;
  status: 'active' | 'pending' | 'suspended';
}

export interface OrganizationInvite {
  id: string;
  organizationId: string;
  email: string;
  role: OrgMemberRole;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
}
