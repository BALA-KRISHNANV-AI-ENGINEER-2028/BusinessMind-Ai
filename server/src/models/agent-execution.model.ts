import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export type AgentExecutionStatus = 'running' | 'completed' | 'failed';

export interface IAgentExecutionDocument extends MongooseDocument<string> {
  _id: string;
  id: string;
  organizationId: string;
  agentId: string;
  status: AgentExecutionStatus;
  query: string;
  knowledgeBaseId?: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  result?: any;
  error?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const agentExecutionSchema = new Schema<IAgentExecutionDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    agentId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed'],
      default: 'running',
      index: true,
    },
    query: { type: String, required: true },
    knowledgeBaseId: { type: String, default: null },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    durationMs: { type: Number, default: 0 },
    result: { type: Schema.Types.Mixed, default: null },
    error: { type: String, default: null },
    createdBy: { type: String, default: 'system' },
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

agentExecutionSchema.index({ organizationId: 1, agentId: 1, createdAt: -1 });

export const AgentExecutionModel =
  mongoose.models['AgentExecution'] ||
  mongoose.model<IAgentExecutionDocument>('AgentExecution', agentExecutionSchema);
