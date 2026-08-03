import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission';
import type { Permission } from '../../types/rbac';

export interface RequirePermissionProps {
  permission: Permission;
  redirectTo?: string;
  children: ReactNode;
}

/**
 * Route guard component that redirects users to an unauthorized page if they
 * lack the necessary permission.
 */
export function RequirePermission({
  permission,
  redirectTo = '/unauthorized',
  children,
}: RequirePermissionProps) {
  const { hasPermission } = usePermission();

  if (!hasPermission(permission)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
