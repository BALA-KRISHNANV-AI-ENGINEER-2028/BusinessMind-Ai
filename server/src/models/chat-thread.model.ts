import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IChatThreadDocument extends MongooseDocument<string> {
  _id: string;
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  previewLabel: string;
  knowledgeBaseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatThreadSchema = new Schema<IChatThreadDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 255 },
    previewLabel: { type: String, default: '', trim: true, maxlength: 255 },
    knowledgeBaseId: { type: String, default: null },
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

chatThreadSchema.index({ organizationId: 1, userId: 1, updatedAt: -1 });

export const ChatThreadModel =
  mongoose.models['ChatThread'] ||
  mongoose.model<IChatThreadDocument>('ChatThread', chatThreadSchema);
