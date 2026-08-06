/**
 * Notification Mongoose Model.
 *
 * User and organization notification center items.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type NotificationType = 'info' | 'warning' | 'action_required';

export interface INotificationDocument extends Document<string> {
  _id: string;
  userId: string;
  organizationId?: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date | null;
  data?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
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
      required: false,
      index: true,
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'action_required'],
      default: 'info',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
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

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel: Model<INotificationDocument> =
  mongoose.models['Notification'] ||
  mongoose.model<INotificationDocument>('Notification', NotificationSchema);
