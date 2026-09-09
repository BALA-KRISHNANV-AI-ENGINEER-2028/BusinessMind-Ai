import { apiClient } from './api.client';
import type { ApiResult } from '../types/api';
import type { Organization, OrganizationMember, OrganizationInvite, OrgMemberRole } from '../types/organization';
import { mockOrganizations, mockOrganizationMembers } from '../mocks/organization.mock';

export const organizationService = {
  async getCurrentOrg(): Promise<ApiResult<Organization>> {
    return apiClient.get<Organization>('/organizations/current', mockOrganizations[0]);
  },

  async updateCurrentOrg(data: Partial<Organization>): Promise<ApiResult<Organization>> {
    return apiClient.patch<Organization>('/organizations/current', data, { ...mockOrganizations[0], ...data });
  },

  async getOrganization(id: string): Promise<ApiResult<Organization>> {
    const org = mockOrganizations.find((o) => o.id === id) || mockOrganizations[0];
    return apiClient.get<Organization>(`/organizations/${id}`, org);
  },

  async updateOrganization(id: string, data: Partial<Organization>): Promise<ApiResult<Organization>> {
    const org = mockOrganizations.find((o) => o.id === id) || mockOrganizations[0];
    return apiClient.patch<Organization>(`/organizations/${id}`, data, { ...org, ...data });
  },

  async getMembers(orgId: string): Promise<ApiResult<OrganizationMember[]>> {
    return apiClient.get<OrganizationMember[]>(`/organizations/${orgId}/members`, mockOrganizationMembers);
  },

  async inviteMember(orgId: string, email: string, role: OrgMemberRole): Promise<ApiResult<OrganizationInvite>> {
    const newInvite: OrganizationInvite = {
      id: `inv_${Date.now()}`,
      organizationId: orgId,
      email,
      role,
      invitedBy: 'Alex Rivera',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    };
    return apiClient.post<OrganizationInvite>(`/organizations/${orgId}/members/invite`, { email, role }, newInvite);
  },

  async removeMember(orgId: string, memberId: string): Promise<ApiResult<{ id: string }>> {
    return apiClient.delete<{ id: string }>(`/organizations/${orgId}/members/${memberId}`, { id: memberId });
  },

  async updateMemberRole(orgId: string, memberId: string, role: OrgMemberRole): Promise<ApiResult<{ id: string; role: OrgMemberRole }>> {
    return apiClient.patch<{ id: string; role: OrgMemberRole }>(`/organizations/${orgId}/members/${memberId}/role`, { role }, { id: memberId, role });
  },
};
