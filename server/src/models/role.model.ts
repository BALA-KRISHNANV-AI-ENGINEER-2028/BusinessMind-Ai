/**
 * Role Mongoose Model.
 *
 * Configurable system or custom organizational RBAC roles.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import type { Role, Permission } from '../constants/app.constants';

export interface IRoleDocument extends Document<string> {
  _id: string;
  organizationId?: string;
  name: string;
  key: Role | string;
  description?: string;
  permissions: Permission[];
  isSystemRole: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRoleDocument>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    organizationId: {
      type: String,
      ref: 'Organization',
      required: false,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    permissions: {
      type: [String],
      default: [],
    },
    isSystemRole: {
      type: Boolean,
      default: false,
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

export const RoleModel: Model<IRoleDocument> =
  mongoose.models['Role'] || mongoose.model<IRoleDocument>('Role', RoleSchema);
