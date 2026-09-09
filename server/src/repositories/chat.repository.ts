import { BaseRepository } from './base.repository';
import { ChatThreadModel, IChatThreadDocument } from '../models/chat-thread.model';
import { ChatMessageModel, IChatMessageDocument, ChatRole } from '../models/chat-message.model';

export interface ChatThreadEntity {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  previewLabel: string;
  knowledgeBaseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageEntity {
  id: string;
  threadId: string;
  organizationId: string;
  userId: string;
  role: ChatRole;
  content: string;
  structured?: any;
  citations?: string[];
  createdAt: string;
}

export class ChatThreadRepository extends BaseRepository<
  IChatThreadDocument,
  ChatThreadEntity,
  Partial<ChatThreadEntity>,
  Partial<ChatThreadEntity>
> {
  constructor() {
    super(ChatThreadModel);
  }

  protected toEntity(doc: IChatThreadDocument): ChatThreadEntity {
    const json = doc.toJSON() as Record<string, unknown>;
    return {
      id: String(json['id'] ?? json['_id']),
      organizationId: String(json['organizationId']),
      userId: String(json['userId']),
      title: String(json['title']),
      previewLabel: String(json['previewLabel'] ?? ''),
      knowledgeBaseId: json['knowledgeBaseId'] ? String(json['knowledgeBaseId']) : undefined,
      createdAt: json['createdAt'] ? new Date(json['createdAt'] as string).toISOString() : new Date().toISOString(),
      updatedAt: json['updatedAt'] ? new Date(json['updatedAt'] as string).toISOString() : new Date().toISOString(),
    };
  }

  async findByUserAndOrg(userId: string, organizationId: string): Promise<ChatThreadEntity[]> {
    if (!this.isConnected()) {
      return Array.from(this.memoryStore.values())
        .filter((t) => t.organizationId === organizationId && t.userId === userId && !t.deletedAt)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    const docs = await this.model
      .find({ organizationId, userId, deletedAt: null })
      .sort({ updatedAt: -1 })
      .exec();
    return docs.map((d) => this.toEntity(d));
  }
}

export class ChatMessageRepository extends BaseRepository<
  IChatMessageDocument,
  ChatMessageEntity,
  Partial<ChatMessageEntity>,
  Partial<ChatMessageEntity>
> {
  constructor() {
    super(ChatMessageModel);
  }

  protected toEntity(doc: IChatMessageDocument): ChatMessageEntity {
    const json = doc.toJSON() as Record<string, unknown>;
    return {
      id: String(json['id'] ?? json['_id']),
      threadId: String(json['threadId']),
      organizationId: String(json['organizationId']),
      userId: String(json['userId']),
      role: json['role'] as ChatRole,
      content: String(json['content']),
      structured: json['structured'] || undefined,
      citations: Array.isArray(json['citations']) ? (json['citations'] as string[]) : undefined,
      createdAt: json['createdAt'] ? new Date(json['createdAt'] as string).toISOString() : new Date().toISOString(),
    };
  }

  async findByThread(threadId: string): Promise<ChatMessageEntity[]> {
    if (!this.isConnected()) {
      return Array.from(this.memoryStore.values())
        .filter((m) => m.threadId === threadId && !m.deletedAt)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    const docs = await this.model
      .find({ threadId, deletedAt: null })
      .sort({ createdAt: 1 })
      .exec();
    return docs.map((d) => this.toEntity(d));
  }
}

export const chatThreadRepository = new ChatThreadRepository();
export const chatMessageRepository = new ChatMessageRepository();
