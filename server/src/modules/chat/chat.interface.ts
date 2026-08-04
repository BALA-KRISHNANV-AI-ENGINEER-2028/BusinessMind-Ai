/** Chat Module — Interface. */
import type { ChatThread, ChatMessage, CreateThreadDto, SendMessageDto } from './chat.types';
import type { PaginationOptions, PaginationMeta } from '../../types/common.types';

export interface IChatService {
  getThreads(userId: string, orgId: string, pagination: PaginationOptions): Promise<{ data: ChatThread[]; pagination: PaginationMeta }>;
  getThreadMessages(threadId: string, userId: string, pagination: PaginationOptions): Promise<{ data: ChatMessage[]; pagination: PaginationMeta }>;
  createThread(userId: string, orgId: string, data: CreateThreadDto): Promise<ChatThread>;
  sendMessage(userId: string, orgId: string, data: SendMessageDto): Promise<ChatMessage>;
  deleteThread(threadId: string, userId: string): Promise<void>;
}
