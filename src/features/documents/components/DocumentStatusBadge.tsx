import { Badge } from '../../../components/ui/Badge';
import type { BadgeVariant } from '../../../components/ui/Badge';

const statusVariants: Record<string, { variant: BadgeVariant; label: string }> = {
  UPLOADING: { variant: 'accent', label: 'Uploading' },
  UPLOADED: { variant: 'accent', label: 'Uploaded' },
  VALIDATING: { variant: 'accent', label: 'Validating' },
  PROCESSING: { variant: 'accent', label: 'Processing' },
  READY: { variant: 'success', label: 'Ready' },
  FAILED: { variant: 'danger', label: 'Failed' },
  DELETED: { variant: 'neutral', label: 'Deleted' },
  // Fallbacks
  processed: { variant: 'success', label: 'Ready' },
  processing: { variant: 'accent', label: 'Processing' },
  failed: { variant: 'danger', label: 'Failed' },
};

export function DocumentStatusBadge({ status }: { status: string }) {
  const normalized = status ? status.toUpperCase() : 'READY';
  const config = statusVariants[normalized] || statusVariants[status] || { variant: 'neutral', label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
