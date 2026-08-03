import { useState } from 'react';
import type { FormEvent } from 'react';
import { Paperclip, Send, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { promptSuggestions } from '../../../mocks/chat.mock';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const { showToast } = useToast();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  }

  function handleSelectSuggestion(suggestion: string) {
    onSend(suggestion);
  }

  return (
    <div className="border-t border-border bg-bg-base p-3 space-y-3">
      {!value && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="flex items-center gap-1 font-medium text-text-secondary shrink-0">
            <Sparkles size={12} className="text-accent-text" aria-hidden="true" />
            Suggestions:
          </span>
          {promptSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="shrink-0 rounded-full border border-border bg-bg-subtle px-2.5 py-1 text-text-secondary transition-colors duration-150 hover:border-border-strong hover:text-text-primary"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <button
          type="button"
          onClick={() =>
            showToast({
              title: 'Attachments coming soon',
              description: 'File attachments will be available once Documents is connected to the assistant.',
              variant: 'info',
            })
          }
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-bg-muted hover:text-text-primary"
          aria-label="Attach a file"
        >
          <Paperclip size={18} aria-hidden="true" />
        </button>

        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSubmit(event);
            }
          }}
          placeholder="Ask your AI Business Consultant..."
          aria-label="Message"
          rows={1}
          disabled={disabled}
          className="max-h-32 min-h-9 flex-1 resize-none rounded-md border border-border bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-bg-muted"
        />

        <Button type="submit" size="md" disabled={disabled || !value.trim()} aria-label="Send message">
          <Send size={16} aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
