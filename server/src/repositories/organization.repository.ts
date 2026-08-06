/**
 * Organization Repository.
 *
 * Mongoose repository for Organization and Membership queries.
 */

import { BaseRepository } from './base.repository';
import { OrganizationModel, IOrganizationDocument } from '../models/organization.model';
import { OrganizationMemberModel } from '../models/organization-member.model';
import type { Role, MemberStatus } from '../constants/app.constants';

export interface OrganizationEntity {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  plan: string;
  status: string;
  settings: {
    allowedDomains: string[];
    maxMembers: number;
    mfaRequired: boolean;
  };
  createdAt: string;
}

export interface OrganizationMemberEntity {
  id: string;
  organizationId: string;
  organizationName: string;
  userId: string;
  role: Role;
  status: MemberStatus;
  joinedAt: string;
}

export class OrganizationRepository extends BaseRepository<
  IOrganizationDocument,
  OrganizationEntity,
  Partial<OrganizationEntity>,
  Partial<OrganizationEntity>
> {
  constructor() {
    super(OrganizationModel);
  }

  protected toEntity(doc: IOrganizationDocument): OrganizationEntity {
    const json = doc.toJSON() as Record<string, unknown>;
    return {
      id: String(json['id'] ?? json['_id']),
      name: String(json['name']),
      slug: String(json['slug']),
      domain: json['domain'] ? String(json['domain']) : undefined,
      plan: String(json['plan']),
      status: String(json['status']),
      settings: json['settings'] as OrganizationEntity['settings'],
      createdAt: json['createdAt'] ? new Date(json['createdAt'] as string).toISOString() : new Date().toISOString(),
    };
  }

  async findBySlug(slug: string): Promise<OrganizationEntity | null> {
    const doc = await this.model.findOne({ slug: slug.toLowerCase().trim(), deletedAt: null }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async getUserMemberships(userId: string): Promise<OrganizationMemberEntity[]> {
    const members = await OrganizationMemberModel.find({ userId, deletedAt: null })
      .populate('organizationId', 'name')
      .exec();

    return members.map((m) => {
      const org = m.organizationId as unknown as { _id: string; name: string } | null;
      return {
        id: String(m._id),
        organizationId: typeof m.organizationId === 'string' ? m.organizationId : org?._id ?? String(m.organizationId),
        organizationName: org?.name ?? 'Organization',
        userId: String(m.userId),
        role: m.role as Role,
        status: m.status as MemberStatus,
        joinedAt: m.joinedAt ? m.joinedAt.toISOString() : m.createdAt.toISOString(),
      };
    });
  }

  async getMemberRole(organizationId: string, userId: string): Promise<Role | null> {
    const member = await OrganizationMemberModel.findOne({
      organizationId,
      userId,
      status: 'active',
      deletedAt: null,
    }).exec();
    return member ? (member.role as Role) : null;
  }

  async addMember(data: {
    organizationId: string;
    userId: string;
    role: Role;
    status?: MemberStatus;
    invitedBy?: string;
  }): Promise<void> {
    await OrganizationMemberModel.create({
      organizationId: data.organizationId,
      userId: data.userId,
      role: data.role,
      status: data.status ?? 'active',
      invitedBy: data.invitedBy,
    });
  }
}

export const organizationRepository = new OrganizationRepository();
