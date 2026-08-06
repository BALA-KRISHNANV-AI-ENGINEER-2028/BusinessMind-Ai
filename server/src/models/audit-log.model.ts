/**
 * AuditLog Mongoose Model.
 *
 * Immutable enterprise audit log trail for security & compliance actions.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IAuditLogDocument extends Document<string> {
  _id: string;
  organizationId?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
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
    userId: {
      type: String,
      ref: 'User',
      required: false,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
    },
    resourceId: {
      type: String,
      required: false,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

AuditLogSchema.index({ organizationId: 1, createdAt: -1 });

export const AuditLogModel: Model<IAuditLogDocument> =
  mongoose.models['AuditLog'] || mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
