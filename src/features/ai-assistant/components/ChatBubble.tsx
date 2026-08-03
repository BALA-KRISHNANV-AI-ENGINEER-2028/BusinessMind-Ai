import type { ReactNode } from 'react';
import { Bot } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { ChatRole } from '../../../types/chat';

interface ChatBubbleProps {
  role: ChatRole;
  content: string;
  timestampLabel: string;
  children?: ReactNode;
}

export function ChatBubble({ role, content, timestampLabel, children }: ChatBubbleProps) {
  const isAssistant = role === 'assistant';

  return (
    <div className={cn('flex gap-3', !isAssistant && 'flex-row-reverse')}>
      {isAssistant && (
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-text-on-accent">
          <Bot size={15} aria-hidden="true" />
        </span>
      )}

      <div className={cn('flex max-w-2xl flex-col gap-3', !isAssistant && 'items-end')}>
        <div
          className={cn(
            'rounded-lg px-3.5 py-2.5 text-sm',
            isAssistant
              ? 'bg-bg-subtle text-text-primary'
              : 'bg-accent text-text-on-accent',
          )}
        >
          {content}
        </div>
        {children}
        <span className="text-xs text-text-disabled">{timestampLabel}</span>
      </div>
    </div>
  );
}
