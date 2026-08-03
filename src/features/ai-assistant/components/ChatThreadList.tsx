import { Plus } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/Button';
import type { ChatThread } from '../../../types/chat';

interface ChatThreadListProps {
  threads: ChatThread[];
  onSelectThread?: (id: string) => void;
  onNewThread?: () => void;
}

export function ChatThreadList({ threads, onSelectThread, onNewThread }: ChatThreadListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3">
        <Button variant="secondary" className="w-full" onClick={onNewThread}>
          <Plus size={16} aria-hidden="true" />
          New conversation
        </Button>
      </div>

      <ul className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label="Conversation history">
        {threads.map((thread) => (
          <li key={thread.id}>
            <button
              type="button"
              onClick={() => onSelectThread?.(thread.id)}
              className={cn(
                'w-full rounded-md px-3 py-2.5 text-left transition-colors duration-150 hover:bg-bg-muted',
                thread.isActive && 'bg-accent-subtle hover:bg-accent-subtle',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    'truncate text-sm font-medium',
                    thread.isActive ? 'text-accent-text' : 'text-text-primary',
                  )}
                >
                  {thread.title}
                </p>
                <span className="shrink-0 text-xs text-text-disabled">{thread.timestampLabel}</span>
              </div>
              <p className="mt-0.5 truncate text-xs text-text-secondary">{thread.previewLabel}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
