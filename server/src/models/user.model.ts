/**
 * User Mongoose Model.
 *
 * Domain model representing an authenticated system user.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import type { Role } from '../constants/app.constants';

export type UserStatus = 'active' | 'invited' | 'suspended';

export interface UserPreferences {
  timezone: string;
  language: string;
  emailNotifications: boolean;
  marketingEmails: boolean;
}

export interface IUserDocument extends Document<string> {
  _id: string;
  email: string;
  passwordHash?: string;
  fullName: string;
  avatarUrl?: string;
  jobTitle?: string;
  phone?: string;
  bio?: string;
  googleId?: string;
  defaultOrganizationId?: string;
  status: UserStatus;
  preferences: UserPreferences;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: false,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    jobTitle: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    defaultOrganizationId: {
      type: String,
      ref: 'Organization',
      required: false,
    },
    status: {
      type: String,
      enum: ['active', 'invited', 'suspended'],
      default: 'active',
      index: true,
    },
    preferences: {
      timezone: { type: String, default: 'America/New_York' },
      language: { type: String, default: 'en-US' },
      emailNotifications: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
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
        delete ret['passwordHash'];
        return ret;
      },
    },
  },
);

UserSchema.index({ email: 1, deletedAt: 1 });

export const UserModel: Model<IUserDocument> =
  mongoose.models['User'] || mongoose.model<IUserDocument>('User', UserSchema);
