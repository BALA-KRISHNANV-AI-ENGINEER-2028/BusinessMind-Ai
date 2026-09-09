import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export type ChatRole = 'user' | 'assistant';

export interface IChatMessageDocument extends MongooseDocument<string> {
  _id: string;
  id: string;
  threadId: string;
  organizationId: string;
  userId: string;
  role: ChatRole;
  content: string;
  structured?: {
    summary?: string;
    evidence?: Array<{ id: string; source: string; snippet: string }>;
    confidence?: number;
    risks?: Array<{ id: string; title: string; level: string; description: string }>;
    recommendations?: Array<{
      id: string;
      title: string;
      summary: string;
      confidence: number;
      riskLevel: string;
      category: string;
    }>;
    actionPlan?: string[];
  };
  citations?: string[];
  modelMetadata?: {
    provider?: string;
    model?: string;
    tokens?: number;
  };
  createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessageDocument>(
  {
    _id: { type: String, required: true },
    threadId: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    structured: { type: Schema.Types.Mixed, default: null },
    citations: [{ type: String }],
    modelMetadata: {
      provider: { type: String },
      model: { type: String },
      tokens: { type: Number },
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

chatMessageSchema.index({ threadId: 1, createdAt: 1 });

export const ChatMessageModel =
  mongoose.models['ChatMessage'] ||
  mongoose.model<IChatMessageDocument>('ChatMessage', chatMessageSchema);
