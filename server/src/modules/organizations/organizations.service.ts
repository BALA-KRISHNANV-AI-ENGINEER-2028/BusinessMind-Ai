/**
 * Organizations Service — Placeholder. Phase 5: Full implementation.
 */

import { AppError } from '../../errors/AppError';
import { HttpStatus } from '../../constants/http.constants';
import type { IOrganizationsService } from './organizations.interface';
import type { Organization, OrganizationMember, OrganizationInvite, UpdateOrganizationDto, InviteMemberDto, UpdateMemberRoleDto } from './organizations.types';
import type { PaginationOptions, PaginationMeta } from '../../types/common.types';

const stub = (m: string) => new AppError(`OrganizationsService.${m} not implemented (Phase 5).`, HttpStatus.NOT_IMPLEMENTED, 'NOT_IMPLEMENTED', true);

export class OrganizationsService implements IOrganizationsService {
  async getById(_id: string): Promise<Organization> { throw stub('getById'); }
  async getMembers(_orgId: string, _p: PaginationOptions): Promise<{ data: OrganizationMember[]; pagination: PaginationMeta }> { throw stub('getMembers'); }
  async update(_id: string, _data: UpdateOrganizationDto): Promise<Organization> { throw stub('update'); }
  async inviteMember(_orgId: string, _data: InviteMemberDto, _by: string): Promise<OrganizationInvite> { throw stub('inviteMember'); }
  async updateMemberRole(_orgId: string, _memberId: string, _data: UpdateMemberRoleDto): Promise<OrganizationMember> { throw stub('updateMemberRole'); }
  async removeMember(_orgId: string, _memberId: string): Promise<void> { throw stub('removeMember'); }
}

export const organizationsService = new OrganizationsService();
