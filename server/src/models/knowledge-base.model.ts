/**
 * Knowledge Base Mongoose Model.
 *
 * Represents an organization-level logical collection of business knowledge & documents.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IKnowledgeBaseDocument extends Document<string> {
  _id: string;
  organizationId: string;
  name: string;
  description: string;
  isDefault: boolean;
  documentCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const KnowledgeBaseSchema = new Schema<IKnowledgeBaseDocument>(
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
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    documentCount: {
      type: Number,
      default: 0,
      min: 0,
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

KnowledgeBaseSchema.index({ organizationId: 1, deletedAt: 1 });
KnowledgeBaseSchema.index({ organizationId: 1, name: 1 });

export const KnowledgeBaseModel: Model<IKnowledgeBaseDocument> =
  mongoose.models['KnowledgeBase'] ||
  mongoose.model<IKnowledgeBaseDocument>('KnowledgeBase', KnowledgeBaseSchema);
