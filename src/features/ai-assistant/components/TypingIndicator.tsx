import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-text-on-accent mt-0.5">
        <Bot size={16} aria-hidden="true" />
      </div>
      <div className="flex items-center gap-1.5 rounded-lg bg-bg-subtle px-3 py-2.5 text-text-secondary border border-border">
        <span className="text-xs">AI Assistant is thinking</span>
        <div className="flex items-center gap-1">
          <span className="size-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );
}
