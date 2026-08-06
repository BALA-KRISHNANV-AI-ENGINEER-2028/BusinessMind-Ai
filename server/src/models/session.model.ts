/**
 * Session Mongoose Model.
 *
 * Tracks active authentication sessions, token families, and refresh rotation state.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ISessionDocument extends Document<string> {
  _id: string;
  userId: string;
  organizationId: string;
  tokenFamily: string;
  refreshTokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  isRevoked: boolean;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISessionDocument>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    userId: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: String,
      ref: 'Organization',
      required: true,
      index: true,
    },
    tokenFamily: {
      type: String,
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
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
        delete ret['refreshTokenHash'];
        return ret;
      },
    },
  },
);

SessionSchema.index({ userId: 1, isRevoked: 1 });
SessionSchema.index({ tokenFamily: 1, isRevoked: 1 });

export const SessionModel: Model<ISessionDocument> =
  mongoose.models['Session'] || mongoose.model<ISessionDocument>('Session', SessionSchema);
