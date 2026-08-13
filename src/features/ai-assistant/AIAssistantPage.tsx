/**
 * AI Assistant Page — Phase 8: LLM Integration.
 *
 * Wires the chat UI to the real POST /api/v1/ai/query endpoint via queryAi().
 * 
 * State machine:
 *   idle → (user submits) → retrieving → analyzing → success | error
 *
 * Error handling:
 *   - Network offline  → clean error message in chat
 *   - Rate limited     → specific retry message
 *   - LLM timeout      → retry message
 *   - Generic error    → standard fallback message
 *
 * The page preserves Phase 7 compatibility:
 *   - ChatThreadList (Phase 5) still rendered
 *   - TypingIndicator still used during loading
 *   - mock chatThreads still used for thread list display
 */

import { useRef, useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { ChatThreadList } from './components/ChatThreadList';
import { ChatBubble } from './components/ChatBubble';
import { ChatInput } from './components/ChatInput';
import { TypingIndicator } from './components/TypingIndicator';
import { AiQueryStatus } from './components/AiQueryStatus';
import { GroundedAiResponse } from './components/GroundedAiResponse';
import { Modal } from '../../components/ui/Modal';
import { chatThreads } from '../../mocks/chat.mock';
import { queryAi } from '../../services/ai.api';
import type { AiQueryResponse } from '../../types/ai-query';

// ─── Types ────────────────────────────────────────────────────────────────────

type LoadingPhase = 'idle' | 'retrieving' | 'analyzing';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestampLabel: string;
  aiResponse?: AiQueryResponse;
  isError?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingPhase]);

  async function handleSend(content: string) {
    if (loadingPhase !== 'idle') return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestampLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoadingPhase('retrieving');

    // Briefly show "retrieving" phase before calling API
    // This gives visual feedback that the system is doing vector search first
    await new Promise((resolve) => setTimeout(resolve, 600));
    setLoadingPhase('analyzing');

    try {
      const response = await queryAi({ query: content });

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.confidence === 'insufficient'
          ? "I don't have enough evidence in the connected business knowledge to answer that reliably."
          : response.answer,
        timestampLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aiResponse: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errorMessage = classifyError(err);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: errorMessage,
        timestampLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoadingPhase('idle');
    }
  }

  const isLoading = loadingPhase !== 'idle';

  return (
    <div className="-m-6 flex h-[calc(100svh-3.5rem)]">
      {/* Thread list — desktop */}
      <div className="hidden w-72 shrink-0 border-r border-border lg:block">
        <ChatThreadList threads={chatThreads} />
      </div>

      {/* Thread list — mobile drawer */}
      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Conversations" size="sm">
        <div className="-mx-5 -my-4">
          <ChatThreadList threads={chatThreads} onSelectThread={() => setHistoryOpen(false)} />
        </div>
      </Modal>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile thread toggle */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-text-secondary hover:bg-bg-muted"
          >
            <History size={16} aria-hidden="true" />
            History
          </button>
        </div>

        {/* Message list */}
        <div className="flex-1 space-y-5 overflow-y-auto p-4" aria-live="polite">
          {/* Empty state */}
          {messages.length === 0 && !isLoading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-accent-subtle">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="size-6 text-accent-text"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">BusinessMind AI</p>
                <p className="mt-1 text-xs text-text-secondary max-w-xs">
                  Ask any business question. I'll search your knowledge base and provide evidence-grounded answers.
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              role={message.role}
              content={message.role === 'user' ? message.content : ''}
              timestampLabel={message.timestampLabel}
            >
              {message.role === 'assistant' && message.aiResponse && (
                <GroundedAiResponse response={message.aiResponse} />
              )}
              {message.role === 'assistant' && !message.aiResponse && (
                <p className={`text-sm ${message.isError ? 'text-danger' : 'text-text-primary'} leading-relaxed`}>
                  {message.content}
                </p>
              )}
            </ChatBubble>
          ))}

          {/* Loading state */}
          {isLoading && (
            <div className="flex gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-text-on-accent">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-4 animate-pulse"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                  />
                </svg>
              </span>
              <div className="flex flex-col gap-2 flex-1 max-w-2xl">
                <AiQueryStatus phase={loadingPhase} />
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} aria-hidden="true" />
        </div>

        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}

// ─── Error Classification ─────────────────────────────────────────────────────

function classifyError(err: unknown): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : '';

  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'The AI service is currently busy. Please wait a moment and try again.';
  }
  if (msg.includes('timeout') || msg.includes('504') || msg.includes('gateway')) {
    return 'The AI service took too long to respond. Please try again.';
  }
  if (msg.includes('401') || msg.includes('unauthorized')) {
    return 'Your session has expired. Please sign in again.';
  }
  if (msg.includes('403') || msg.includes('forbidden') || msg.includes('kb_access')) {
    return 'You do not have permission to access that knowledge base.';
  }
  if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('offline')) {
    return 'Unable to connect to the server. Please check your connection and try again.';
  }
  if (msg.includes('502') || msg.includes('bad gateway') || msg.includes('provider')) {
    return 'The AI provider returned an unexpected response. Please try again.';
  }
  return 'AI query failed due to an unexpected error. Please try again.';
}
