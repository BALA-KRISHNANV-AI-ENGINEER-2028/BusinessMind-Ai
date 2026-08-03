import { apiClient } from './api.client';
import type { ApiResult } from '../types/api';
import { organizationMembers } from '../mocks/organizations.mock';
import type { OrganizationMember } from '../mocks/organizations.mock';

export const organizationsService = {
  async getMembers(): Promise<ApiResult<OrganizationMember[]>> {
    return apiClient.get(organizationMembers);
  },

  async inviteMember(email: string, role: string): Promise<ApiResult<OrganizationMember>> {
    const newMember: OrganizationMember = {
      id: `mem_${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: role as OrganizationMember['role'],
      joinedLabel: 'Pending',
    };
    return apiClient.post(newMember);
  },
};
