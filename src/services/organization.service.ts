import { apiClient } from './api.client';
import type { ApiResult } from '../types/api';
import type { Organization, OrganizationMember, OrganizationInvite, OrgMemberRole } from '../types/organization';

export const organizationService = {
  async getCurrentOrg(): Promise<ApiResult<Organization>> {
    return apiClient.get<Organization>('/organizations/current');
  },

  async updateCurrentOrg(data: Partial<Organization>): Promise<ApiResult<Organization>> {
    return apiClient.patch<Organization>('/organizations/current', data);
  },

  async getOrganization(id: string): Promise<ApiResult<Organization>> {
    return apiClient.get<Organization>(`/organizations/${id}`);
  },

  async updateOrganization(id: string, data: Partial<Organization>): Promise<ApiResult<Organization>> {
    return apiClient.patch<Organization>(`/organizations/${id}`, data);
  },

  async getMembers(orgId: string): Promise<ApiResult<OrganizationMember[]>> {
    return apiClient.get<OrganizationMember[]>(`/organizations/${orgId}/members`);
  },

  async inviteMember(orgId: string, email: string, role: OrgMemberRole): Promise<ApiResult<OrganizationInvite>> {
    return apiClient.post<OrganizationInvite>(`/organizations/${orgId}/members/invite`, { email, role });
  },

  async removeMember(orgId: string, memberId: string): Promise<ApiResult<{ id: string }>> {
    return apiClient.delete<{ id: string }>(`/organizations/${orgId}/members/${memberId}`);
  },

  async updateMemberRole(orgId: string, memberId: string, role: OrgMemberRole): Promise<ApiResult<{ id: string; role: OrgMemberRole }>> {
    return apiClient.patch<{ id: string; role: OrgMemberRole }>(`/organizations/${orgId}/members/${memberId}/role`, { role });
  },
};
