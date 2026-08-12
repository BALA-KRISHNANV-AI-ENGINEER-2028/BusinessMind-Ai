/**
 * Organizations Service.
 *
 * Implements Multi-Tenant Organization management, Settings, Member Listing,
 * Member Invitations, Role Updates, and Member Removal.
 */

import { v4 as uuidv4 } from 'uuid';
import { organizationRepository } from '../../repositories/organization.repository';
import { userRepository } from '../../repositories/user.repository';
import { OrganizationMemberModel } from '../../models/organization-member.model';
import { UserModel } from '../../models/user.model';
import { auditLogService } from '../../services/auditLog.service';
import { NotFoundError, DuplicateKeyError, ValidationError } from '../../errors/HttpErrors';
import type { Role, MemberStatus } from '../../constants/app.constants';
import type {
  Organization,
  OrganizationMember,
  OrganizationInvite,
  UpdateOrganizationDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
} from './organizations.types';
import type { PaginationOptions, PaginationMeta } from '../../types/common.types';
import { buildPaginationMeta, toMongoosePagination } from '../../utils/pagination.util';

export class OrganizationsService {
  /**
   * Retrieves an organization by ID.
   */
  async getById(orgId: string): Promise<Organization> {
    const org = await organizationRepository.findById(orgId);
    if (!org) {
      throw new NotFoundError('Organization not found.');
    }
    const members = await OrganizationMemberModel.countDocuments({ organizationId: orgId, deletedAt: null }).exec();

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      domain: org.domain,
      website: org.website,
      industry: org.industry,
      companySize: org.companySize,
      description: org.description,
      country: org.country,
      timezone: org.timezone,
      plan: org.plan as Organization['plan'],
      status: org.status as Organization['status'],
      memberCount: members,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt || org.createdAt,
    };
  }

  /**
   * Lists organization members with roles and status.
   */
  async getMembers(
    orgId: string,
    pagination: PaginationOptions,
  ): Promise<{ data: OrganizationMember[]; pagination: PaginationMeta }> {
    const { skip, limit } = toMongoosePagination(pagination);

    const [docs, total] = await Promise.all([
      OrganizationMemberModel.find({ organizationId: orgId, deletedAt: null })
        .populate('userId', 'email fullName avatarUrl jobTitle')
        .skip(skip)
        .limit(limit)
        .exec(),
      OrganizationMemberModel.countDocuments({ organizationId: orgId, deletedAt: null }).exec(),
    ]);

    const data: OrganizationMember[] = docs.map((doc) => {
      const user = doc.userId as unknown as { _id: string; email: string; fullName: string; avatarUrl?: string; jobTitle?: string } | null;
      return {
        id: doc._id,
        organizationId: doc.organizationId,
        userId: typeof doc.userId === 'string' ? doc.userId : user?._id ?? String(doc.userId),
        email: user?.email ?? 'user@businessmind.ai',
        fullName: user?.fullName ?? 'Member',
        avatarUrl: user?.avatarUrl,
        jobTitle: user?.jobTitle,
        role: doc.role as Role,
        status: doc.status as MemberStatus,
        joinedAt: doc.joinedAt ? doc.joinedAt.toISOString() : doc.createdAt.toISOString(),
      };
    });

    return {
      data,
      pagination: buildPaginationMeta(pagination, total),
    };
  }

  /**
   * Updates organization settings & metadata.
   */
  async update(orgId: string, data: UpdateOrganizationDto): Promise<Organization> {
    const org = await organizationRepository.findById(orgId);
    if (!org) {
      throw new NotFoundError('Organization not found.');
    }

    const updated = await organizationRepository.update(orgId, {
      name: data.name ? data.name.trim() : org.name,
      domain: data.domain !== undefined ? data.domain.trim() : org.domain,
      website: data.website !== undefined ? data.website.trim() : org.website,
      industry: data.industry !== undefined ? data.industry.trim() : org.industry,
      companySize: data.companySize !== undefined ? data.companySize.trim() : org.companySize,
      description: data.description !== undefined ? data.description.trim() : org.description,
      country: data.country !== undefined ? data.country.trim() : org.country,
      timezone: data.timezone !== undefined ? data.timezone.trim() : org.timezone,
    });

    if (!updated) {
      throw new NotFoundError('Failed to update organization.');
    }

    await auditLogService.log({
      organizationId: orgId,
      action: 'org.update_settings',
      resource: 'Organization',
      resourceId: orgId,
    });

    return this.getById(orgId);
  }

  /**
   * Invites a new member to the organization.
   */
  async inviteMember(
    orgId: string,
    data: InviteMemberDto,
    invitedByUserId: string,
  ): Promise<OrganizationInvite> {
    const org = await organizationRepository.findById(orgId);
    if (!org) {
      throw new NotFoundError('Organization not found.');
    }

    const normalizedEmail = data.email.toLowerCase().trim();
    let userRecord = await userRepository.findByEmail(normalizedEmail);

    if (!userRecord) {
      // Create invited user placeholder
      const user = await userRepository.create({
        id: uuidv4(),
        email: normalizedEmail,
        fullName: normalizedEmail.split('@')[0] || 'Invited User',
        defaultOrganizationId: orgId,
        status: 'invited',
      });
      userRecord = { user, doc: null as never };
    }

    const existingMember = await OrganizationMemberModel.findOne({
      organizationId: orgId,
      userId: userRecord.user.id,
      deletedAt: null,
    }).exec();

    if (existingMember) {
      throw new DuplicateKeyError('User is already a member of this organization.');
    }

    await organizationRepository.addMember({
      organizationId: orgId,
      userId: userRecord.user.id,
      role: data.role,
      status: 'pending',
      invitedBy: invitedByUserId,
    });

    await auditLogService.log({
      organizationId: orgId,
      userId: invitedByUserId,
      action: 'org.member_invited',
      resource: 'OrganizationMember',
      details: { invitedEmail: normalizedEmail, role: data.role },
    });

    return {
      id: uuidv4(),
      organizationId: orgId,
      email: normalizedEmail,
      role: data.role,
      invitedBy: invitedByUserId,
      token: uuidv4(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Updates an existing member's role.
   */
  async updateMemberRole(
    orgId: string,
    memberId: string,
    data: UpdateMemberRoleDto,
  ): Promise<OrganizationMember> {
    const member = await OrganizationMemberModel.findOne({
      _id: memberId,
      organizationId: orgId,
      deletedAt: null,
    }).exec();

    if (!member) {
      throw new NotFoundError('Organization member not found.');
    }

    member.role = data.role;
    await member.save();

    await auditLogService.log({
      organizationId: orgId,
      action: 'org.member_role_updated',
      resource: 'OrganizationMember',
      resourceId: memberId,
      details: { newRole: data.role },
    });

    const user = await UserModel.findById(member.userId).exec();

    return {
      id: member._id,
      organizationId: member.organizationId,
      userId: member.userId,
      email: user?.email ?? '',
      fullName: user?.fullName ?? '',
      role: member.role as Role,
      status: member.status as MemberStatus,
      joinedAt: member.joinedAt ? member.joinedAt.toISOString() : member.createdAt.toISOString(),
    };
  }

  /**
   * Removes a member from the organization.
   */
  async removeMember(orgId: string, memberId: string): Promise<void> {
    const member = await OrganizationMemberModel.findOne({
      _id: memberId,
      organizationId: orgId,
      deletedAt: null,
    }).exec();

    if (!member) {
      throw new NotFoundError('Organization member not found.');
    }

    member.deletedAt = new Date();
    await member.save();

    await auditLogService.log({
      organizationId: orgId,
      action: 'org.member_removed',
      resource: 'OrganizationMember',
      resourceId: memberId,
    });
  }
}

export const organizationsService = new OrganizationsService();
