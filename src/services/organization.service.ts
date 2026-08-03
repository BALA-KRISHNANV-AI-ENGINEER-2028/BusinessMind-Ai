import { apiClient } from './api.client';
import type { ApiResult } from '../types/api';
import type { Organization, OrganizationMember, OrganizationInvite, OrgMemberRole } from '../types/organization';
import { mockOrganizations, mockOrganizationMembers } from '../mocks/organization.mock';

export const organizationService = {
  async getOrganizations(): Promise<ApiResult<Organization[]>> {
    return apiClient.get(mockOrganizations);
  },

  async getOrganization(id: string): Promise<ApiResult<Organization | undefined>> {
    const org = mockOrganizations.find((o) => o.id === id);
    return apiClient.get(org);
  },

  async getMembers(orgId: string): Promise<ApiResult<OrganizationMember[]>> {
    const members = mockOrganizationMembers.filter((m) => m.organizationId === orgId);
    return apiClient.get(members);
  },

  async inviteMember(orgId: string, email: string, role: OrgMemberRole): Promise<ApiResult<OrganizationInvite>> {
    const invite: OrganizationInvite = {
      id: `inv_${Date.now()}`,
      organizationId: orgId,
      email,
      role,
      invitedBy: 'Alex Rivera',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    };
    return apiClient.post(invite);
  },

  async removeMember(memberId: string): Promise<ApiResult<{ id: string }>> {
    return apiClient.delete({ id: memberId });
  },

  async updateMemberRole(memberId: string, role: OrgMemberRole): Promise<ApiResult<{ id: string; role: OrgMemberRole }>> {
    return apiClient.put({ id: memberId, role });
  },
};
