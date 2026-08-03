import { apiClient } from './api.client';
import type { ApiResult } from '../types/api';
import type { ChatMessage, ChatThread } from '../types/chat';
import { chatThreads, activeThreadMessages } from '../mocks/chat.mock';

export const aiService = {
  async getThreads(): Promise<ApiResult<ChatThread[]>> {
    return apiClient.get(chatThreads);
  },

  async getMessages(_threadId: string): Promise<ApiResult<ChatMessage[]>> {
    return apiClient.get(activeThreadMessages);
  },

  async sendMessage(_threadId: string, content: string): Promise<ApiResult<ChatMessage>> {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestampLabel: 'Just now',
    };
    return apiClient.post(newMessage);
  },
};
