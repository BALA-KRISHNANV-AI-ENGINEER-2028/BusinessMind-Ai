/** Chat Service — Placeholder. Phase 5: Implementation. */
import { AppError } from '../../errors/AppError';
import { HttpStatus } from '../../constants/http.constants';
import type { IChatService } from './chat.interface';
import type { ChatThread, ChatMessage, CreateThreadDto, SendMessageDto } from './chat.types';
import type { PaginationOptions, PaginationMeta } from '../../types/common.types';

const stub = (m: string) => new AppError(`ChatService.${m} not implemented (Phase 5).`, HttpStatus.NOT_IMPLEMENTED, 'NOT_IMPLEMENTED', true);

export class ChatService implements IChatService {
  async getThreads(_userId: string, _orgId: string, _p: PaginationOptions): Promise<{ data: ChatThread[]; pagination: PaginationMeta }> { throw stub('getThreads'); }
  async getThreadMessages(_tId: string, _userId: string, _p: PaginationOptions): Promise<{ data: ChatMessage[]; pagination: PaginationMeta }> { throw stub('getThreadMessages'); }
  async createThread(_userId: string, _orgId: string, _d: CreateThreadDto): Promise<ChatThread> { throw stub('createThread'); }
  async sendMessage(_userId: string, _orgId: string, _d: SendMessageDto): Promise<ChatMessage> { throw stub('sendMessage'); }
  async deleteThread(_tId: string, _userId: string): Promise<void> { throw stub('deleteThread'); }
}
export const chatService = new ChatService();
