import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

export type ToastVariant = 'success' | 'warning' | 'danger' | 'info';

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

const variantConfig: Record<ToastVariant, { icon: typeof Info; iconClass: string }> = {
  success: { icon: CheckCircle2, iconClass: 'text-success' },
  warning: { icon: AlertTriangle, iconClass: 'text-warning' },
  danger: { icon: XCircle, iconClass: 'text-danger' },
  info: { icon: Info, iconClass: 'text-accent' },
};

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const { icon: Icon, iconClass } = variantConfig[toast.variant ?? 'info'];

  return (
    <div
      role="status"
      className={cn(
        'flex w-80 items-start gap-3 rounded-md border border-border bg-bg-base p-3 shadow-md',
      )}
    >
      <Icon size={18} className={cn("mt-0.5 shrink-0", iconClass)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-sm text-text-secondary">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="rounded-md p-0.5 text-text-secondary hover:bg-bg-muted hover:text-text-primary"
        aria-label="Dismiss notification"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
