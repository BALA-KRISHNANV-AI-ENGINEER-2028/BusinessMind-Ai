/**
 * Chat Module — Types.
 * Mirrors frontend ChatMessage, ChatThread, StructuredResponse types.
 */

import type { ISODateString } from '../../types/common.types';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  threadId: string;
  role: ChatRole;
  content: string;
  // Phase 6+: structuredResponse, citations, agentTrace
  createdAt: ISODateString;
}

export interface ChatThread {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  messageCount: number;
  lastMessageAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateThreadDto {
  title?: string;
}

export interface SendMessageDto {
  content: string;
  threadId?: string; // Omit to create a new thread
}
