import type { PermissionMatrix } from '../types/rbac';
import { ROLE_DEFINITIONS } from '../constants/rbac.constants';
import type { OrgMemberRole } from '../types/organization';

export const mockPermissionMatrix: PermissionMatrix = {
  super_admin: new Set(ROLE_DEFINITIONS.super_admin.permissions),
  org_admin: new Set(ROLE_DEFINITIONS.org_admin.permissions),
  manager: new Set(ROLE_DEFINITIONS.manager.permissions),
  analyst: new Set(ROLE_DEFINITIONS.analyst.permissions),
  employee: new Set(ROLE_DEFINITIONS.employee.permissions),
};

export function hasRolePermission(role: OrgMemberRole, permission: string): boolean {
  const permissions = mockPermissionMatrix[role];
  return permissions ? permissions.has(permission as any) : false;
}
