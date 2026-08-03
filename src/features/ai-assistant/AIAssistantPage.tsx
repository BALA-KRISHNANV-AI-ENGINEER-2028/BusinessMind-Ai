import { useState } from 'react';
import { History } from 'lucide-react';
import { ChatThreadList } from './components/ChatThreadList';
import { ChatBubble } from './components/ChatBubble';
import { ChatInput } from './components/ChatInput';
import { StructuredResponse } from './components/StructuredResponse';
import { TypingIndicator } from './components/TypingIndicator';
import { Modal } from '../../components/ui/Modal';
import { chatThreads, activeThreadMessages } from '../../mocks/chat.mock';
import type { ChatMessage } from '../../types/chat';

export function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(activeThreadMessages);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  function handleSend(content: string) {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestampLabel: 'Just now',
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response with a delay
    setTimeout(() => {
      setIsTyping(false);
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I've reviewed your query and analyzed the relevant data in your knowledge base. Here's my assessment based on the available information.",
        timestampLabel: 'Just now',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 2000);
  }

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

        <div className="flex-1 space-y-6 overflow-y-auto p-4" aria-live="polite">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              role={message.role}
              content={message.content}
              timestampLabel={message.timestampLabel}
            >
              {message.structured && <StructuredResponse response={message.structured} />}
            </ChatBubble>
          ))}
          {isTyping && <TypingIndicator />}
        </div>

        <ChatInput onSend={handleSend} disabled={isTyping} />
      </div>
    </div>
  );
}
