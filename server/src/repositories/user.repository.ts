/**
 * User Repository.
 *
 * Mongoose repository for User CRUD and domain lookups.
 */

import { BaseRepository } from './base.repository';
import { UserModel, IUserDocument } from '../models/user.model';
import type { User } from '../types/auth.types';

export interface UserCreateDto {
  id?: string;
  email: string;
  passwordHash?: string;
  fullName: string;
  avatarUrl?: string;
  jobTitle?: string;
  phone?: string;
  bio?: string;
  googleId?: string;
  defaultOrganizationId?: string;
  status?: string;
  preferences?: User['preferences'];
}

export class UserRepository extends BaseRepository<
  IUserDocument,
  User,
  UserCreateDto,
  Partial<UserCreateDto>
> {
  constructor() {
    super(UserModel);
  }

  protected toEntity(doc: IUserDocument): User {
    const json = doc.toJSON() as Record<string, unknown>;
    return {
      id: String(json['id'] ?? json['_id']),
      email: String(json['email']),
      fullName: String(json['fullName']),
      avatarUrl: json['avatarUrl'] ? String(json['avatarUrl']) : undefined,
      jobTitle: json['jobTitle'] ? String(json['jobTitle']) : undefined,
      phone: json['phone'] ? String(json['phone']) : undefined,
      bio: json['bio'] ? String(json['bio']) : undefined,
      defaultOrganizationId: String(json['defaultOrganizationId'] ?? ''),
      preferences: json['preferences'] as User['preferences'],
      createdAt: json['createdAt'] ? new Date(json['createdAt'] as string).toISOString() : new Date().toISOString(),
    };
  }

  async findByEmail(email: string): Promise<{ user: User; passwordHash?: string; doc: IUserDocument } | null> {
    const doc = await this.model
      .findOne({ email: email.toLowerCase().trim(), deletedAt: null })
      .exec();
    if (!doc) return null;
    return {
      user: this.toEntity(doc),
      passwordHash: doc.passwordHash,
      doc,
    };
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const doc = await this.model.findOne({ googleId, deletedAt: null }).exec();
    return doc ? this.toEntity(doc) : null;
  }
}

export const userRepository = new UserRepository();
