import { Badge } from '../../../components/ui/Badge';
import type { BadgeVariant } from '../../../components/ui/Badge';
import type { DocumentStatus } from '../../../types/business';

const statusVariant: Record<DocumentStatus, BadgeVariant> = {
  processed: 'success',
  processing: 'accent',
  failed: 'danger',
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <Badge variant={statusVariant[status]}>{status}</Badge>;
}
