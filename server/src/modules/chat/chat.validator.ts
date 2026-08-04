/** Chat Validators. */
import { z } from 'zod';
import { paginationQuerySchema } from '../../validators/common.validators';

export const listChatThreadsQuerySchema = z.object({
  query: paginationQuerySchema,
});

export const createThreadSchema = z.object({
  body: z.object({
    title: z.string().trim().max(100).optional(),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().trim().min(1, 'Message content cannot be empty'),
    threadId: z.string().optional(),
  }),
});
