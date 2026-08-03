import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useOrganization } from './OrganizationContext';
import { mockPermissionMatrix } from '../mocks/rbac.mock';
import type { Permission } from '../types/rbac';

interface PermissionContextValue {
  hasPermission: (permission: Permission) => boolean;
  hasRole: (roles: string | string[]) => boolean;
}

export const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { currentRole } = useOrganization();

  const permissions = useMemo(
    () => mockPermissionMatrix[currentRole] ?? new Set<Permission>(),
    [currentRole],
  );

  const hasPermission = (permission: Permission): boolean => {
    return permissions.has(permission);
  };

  const hasRole = (roles: string | string[]): boolean => {
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(currentRole);
  };

  const value = useMemo(
    () => ({
      hasPermission,
      hasRole,
    }),
    [permissions, currentRole],
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermission() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
}
