/**
 * Organizations Module — Interface.
 */

import type { Organization, OrganizationMember, OrganizationInvite, CreateOrganizationDto, UpdateOrganizationDto, InviteMemberDto, UpdateMemberRoleDto } from './organizations.types';
import type { PaginationOptions, PaginationMeta } from '../../types/common.types';

export interface IOrganizationsService {
  getById(id: string): Promise<Organization>;
  getMembers(orgId: string, pagination: PaginationOptions): Promise<{ data: OrganizationMember[]; pagination: PaginationMeta }>;
  update(id: string, data: UpdateOrganizationDto): Promise<Organization>;
  inviteMember(orgId: string, data: InviteMemberDto, invitedById: string): Promise<OrganizationInvite>;
  updateMemberRole(orgId: string, memberId: string, data: UpdateMemberRoleDto): Promise<OrganizationMember>;
  removeMember(orgId: string, memberId: string): Promise<void>;
}
