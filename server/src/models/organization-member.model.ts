/**
 * OrganizationMember Mongoose Model.
 *
 * Joins Users to Organizations with role and membership status.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import type { Role, MemberStatus } from '../constants/app.constants';

export interface IOrganizationMemberDocument extends Document<string> {
  _id: string;
  organizationId: string;
  userId: string;
  role: Role;
  status: MemberStatus;
  invitedBy?: string;
  joinedAt?: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationMemberSchema = new Schema<IOrganizationMemberDocument>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    organizationId: {
      type: String,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['super_admin', 'org_admin', 'manager', 'analyst', 'employee'],
      default: 'employee',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'active',
      index: true,
    },
    invitedBy: {
      type: String,
      ref: 'User',
      required: false,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret['id'] = ret['_id'];
        delete ret['_id'];
        delete ret['__v'];
        return ret;
      },
    },
  },
);

// Compound unique index: a user can belong to an organization only once
OrganizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export const OrganizationMemberModel: Model<IOrganizationMemberDocument> =
  mongoose.models['OrganizationMember'] ||
  mongoose.model<IOrganizationMemberDocument>('OrganizationMember', OrganizationMemberSchema);
