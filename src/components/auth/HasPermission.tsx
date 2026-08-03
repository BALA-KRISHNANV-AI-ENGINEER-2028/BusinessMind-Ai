import type { ReactNode } from 'react';
import { usePermission } from '../../hooks/usePermission';
import type { Permission } from '../../types/rbac';

export interface HasPermissionProps {
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Declarative UI wrapper that renders its children only if the active user
 * possesses the specified RBAC permission in their active organization.
 */
export function HasPermission({ permission, fallback = null, children }: HasPermissionProps) {
  const { hasPermission } = usePermission();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
