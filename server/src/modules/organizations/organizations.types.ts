/**
 * Organizations Module — Types.
 * Mirrors the frontend Organization, OrganizationMember, OrganizationInvite types.
 */

import type { ISODateString } from '../../types/common.types';
import type { Role } from '../../constants/app.constants';
import type { OrgPlan, MemberStatus } from '../../constants/app.constants';

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
  plan: OrgPlan;
  status?: string;
  memberCount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  jobTitle?: string;
  joinedAt: ISODateString;
  status: MemberStatus;
}

export interface OrganizationInvite {
  id: string;
  organizationId: string;
  email: string;
  role: Role;
  invitedBy: string;
  token?: string;
  createdAt: ISODateString;
  expiresAt: ISODateString;
}

export interface CreateOrganizationDto {
  name: string;
  slug?: string;
  domain?: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  description?: string;
  country?: string;
  timezone?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  domain?: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  description?: string;
  country?: string;
  timezone?: string;
}

export interface InviteMemberDto {
  email: string;
  role: Role;
}

export interface UpdateMemberRoleDto {
  role: Role;
}
