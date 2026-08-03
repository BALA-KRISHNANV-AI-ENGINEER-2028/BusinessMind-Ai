import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';
import { FormField } from './FormField';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, id, label, error, helperText, required, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    return (
      <FormField
        id={textareaId}
        label={label}
        error={error}
        helperText={helperText}
        required={required}
      >
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          className={cn(
            'min-h-20 w-full rounded-md border border-border bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled',
            'transition-colors duration-150 focus:border-accent focus:outline-none',
            'disabled:cursor-not-allowed disabled:bg-bg-muted disabled:text-text-disabled',
            error && 'border-danger focus:border-danger',
            className,
          )}
          {...props}
        />
      </FormField>
    );
  },
);

Textarea.displayName = 'Textarea';
