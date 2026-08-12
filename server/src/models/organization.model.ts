/**
 * Organization Mongoose Model.
 *
 * Multi-tenant organization boundaries for SaaS customers.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import type { OrgPlan } from '../constants/app.constants';

export type OrganizationStatus = 'active' | 'suspended';

export interface OrganizationSettings {
  allowedDomains: string[];
  maxMembers: number;
  mfaRequired: boolean;
}

export interface IOrganizationDocument extends Document<string> {
  _id: string;
  name: string;
  slug: string;
  domain?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  description?: string;
  country?: string;
  timezone?: string;
  plan: OrgPlan;
  status: OrganizationStatus;
  settings: OrganizationSettings;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganizationDocument>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    domain: {
      type: String,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    website: {
      type: String,
      default: '',
      trim: true,
    },
    industry: {
      type: String,
      default: '',
      trim: true,
    },
    companySize: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    country: {
      type: String,
      default: '',
      trim: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
      trim: true,
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'pro',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      index: true,
    },
    settings: {
      allowedDomains: { type: [String], default: [] },
      maxMembers: { type: Number, default: 50 },
      mfaRequired: { type: Boolean, default: false },
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

OrganizationSchema.index({ slug: 1, deletedAt: 1 });

export const OrganizationModel: Model<IOrganizationDocument> =
  mongoose.models['Organization'] ||
  mongoose.model<IOrganizationDocument>('Organization', OrganizationSchema);
