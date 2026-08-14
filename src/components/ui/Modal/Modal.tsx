import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Keep a stable ref to onClose so the keydown handler never needs to be
  // a dependency of the effect. Without this, the inline arrow function
  // passed by the parent re-creates on every keystroke → new reference →
  // effect re-runs → dialogRef.focus() steals focus from the input.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    // Capture the element that had focus before the modal opened so we can
    // restore it when the modal closes.
    previouslyFocused.current = document.activeElement as HTMLElement;
    // Move focus to the dialog container so keyboard navigation works from
    // the start. This only runs when `open` transitions to true, NOT on
    // every re-render caused by typing.
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseRef.current();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previouslyFocused.current?.focus();
    };
    // Intentionally omit onClose — we use onCloseRef to always call the
    // latest version without making it a dependency that re-runs the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-bg-overlay" onClick={onClose} aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[85svh] w-full flex-col rounded-lg border border-border bg-bg-base shadow-md focus:outline-none z-50',
          sizeClasses[size],
        )}
      >
        {(title || description) && (
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              {title && (
                <h2 id={titleId} className="text-base font-semibold text-text-primary">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="mt-1 text-sm text-text-secondary">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-text-secondary hover:bg-bg-muted hover:text-text-primary"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
