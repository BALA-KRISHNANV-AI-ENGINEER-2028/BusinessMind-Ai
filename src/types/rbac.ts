import type { OrgMemberRole } from './organization';

/**
 * Role-Based Access Control (RBAC) permission flags.
 */
export type Permission =
  // Organization management
  | 'org:settings:edit'
  | 'org:members:invite'
  | 'org:members:remove'
  | 'org:members:change_role'
  | 'org:billing:view'
  | 'org:billing:edit'

  // Documents
  | 'documents:upload'
  | 'documents:delete'
  | 'documents:read'

  // AI & Analytics
  | 'ai:chat'
  | 'recommendations:dismiss'
  | 'recommendations:read'
  | 'analytics:view_sensitive'
  | 'analytics:read';

export interface RoleDefinition {
  role: OrgMemberRole;
  label: string;
  description: string;
  permissions: Permission[];
}

export type PermissionMatrix = Record<OrgMemberRole, Set<Permission>>;
