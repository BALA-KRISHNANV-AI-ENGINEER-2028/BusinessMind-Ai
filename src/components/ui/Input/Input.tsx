import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/utils';
import { FormField } from './FormField';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, id, label, error, helperText, required, leadingIcon, trailingIcon, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <FormField id={inputId} label={label} error={error} helperText={helperText} required={required}>
        <div className="relative flex items-center">
          {leadingIcon && (
            <span className="pointer-events-none absolute left-3 text-text-secondary" aria-hidden="true">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={cn(
              'h-9 w-full rounded-md border border-border bg-bg-base px-3 text-sm text-text-primary placeholder:text-text-disabled',
              'transition-colors duration-150 focus:border-accent focus:outline-none',
              'disabled:cursor-not-allowed disabled:bg-bg-muted disabled:text-text-disabled',
              error && 'border-danger focus:border-danger',
              leadingIcon && 'pl-9',
              trailingIcon && 'pr-9',
              className,
            )}
            {...props}
          />
          {trailingIcon && (
            <span className="absolute right-3 text-text-secondary" aria-hidden="true">
              {trailingIcon}
            </span>
          )}
        </div>
      </FormField>
    );
  },
);

Input.displayName = 'Input';
