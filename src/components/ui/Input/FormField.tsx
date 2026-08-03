import type { ReactNode } from 'react';
import { cn } from '../../../lib/utils';

interface FormFieldProps {
  id: string;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ id, label, error, helperText, required, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className={cn('text-xs text-danger')} role="alert">
          {error}
        </p>
      ) : (
        helperText && <p className="text-xs text-text-secondary">{helperText}</p>
      )}
    </div>
  );
}
