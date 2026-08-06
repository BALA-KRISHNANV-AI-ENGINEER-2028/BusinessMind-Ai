/**
 * Settings Mongoose Model.
 *
 * Categorized organizational settings and configurations.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type SettingsCategory = 'general' | 'security' | 'notifications';

export interface ISettingsDocument extends Document<string> {
  _id: string;
  organizationId: string;
  category: SettingsCategory;
  config: Record<string, unknown>;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettingsDocument>(
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
    category: {
      type: String,
      enum: ['general', 'security', 'notifications'],
      required: true,
      index: true,
    },
    config: {
      type: Schema.Types.Mixed,
      default: {},
    },
    updatedBy: {
      type: String,
      ref: 'User',
      required: false,
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

SettingsSchema.index({ organizationId: 1, category: 1 }, { unique: true });

export const SettingsModel: Model<ISettingsDocument> =
  mongoose.models['Settings'] || mongoose.model<ISettingsDocument>('Settings', SettingsSchema);
