import type { RoleDefinition, Permission } from '../types/rbac';

export const ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
  super_admin: {
    role: 'super_admin',
    label: 'Super Admin',
    description: 'Full platform access across all organizations and system settings.',
    permissions: [
      'org:settings:edit',
      'org:members:invite',
      'org:members:remove',
      'org:members:change_role',
      'org:billing:view',
      'org:billing:edit',
      'documents:upload',
      'documents:delete',
      'documents:read',
      'ai:chat',
      'recommendations:dismiss',
      'recommendations:read',
      'analytics:view_sensitive',
      'analytics:read',
    ],
  },

  org_admin: {
    role: 'org_admin',
    label: 'Organization Admin',
    description: 'Can manage organization settings, members, billing, and all features.',
    permissions: [
      'org:settings:edit',
      'org:members:invite',
      'org:members:remove',
      'org:members:change_role',
      'org:billing:view',
      'org:billing:edit',
      'documents:upload',
      'documents:delete',
      'documents:read',
      'ai:chat',
      'recommendations:dismiss',
      'recommendations:read',
      'analytics:view_sensitive',
      'analytics:read',
    ],
  },

  manager: {
    role: 'manager',
    label: 'Manager',
    description: 'Can invite members, upload & delete documents, and view sensitive analytics.',
    permissions: [
      'org:members:invite',
      'documents:upload',
      'documents:delete',
      'documents:read',
      'ai:chat',
      'recommendations:dismiss',
      'recommendations:read',
      'analytics:view_sensitive',
      'analytics:read',
    ],
  },

  analyst: {
    role: 'analyst',
    label: 'Analyst',
    description: 'Can upload documents, run AI queries, and view standard analytics.',
    permissions: [
      'documents:upload',
      'documents:read',
      'ai:chat',
      'recommendations:read',
      'analytics:read',
    ],
  },

  employee: {
    role: 'employee',
    label: 'Employee',
    description: 'Standard access for viewing documents and using the AI assistant.',
    permissions: [
      'documents:read',
      'ai:chat',
      'recommendations:read',
      'analytics:read',
    ],
  },
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  'org:settings:edit': 'Edit Organization Settings',
  'org:members:invite': 'Invite Organization Members',
  'org:members:remove': 'Remove Organization Members',
  'org:members:change_role': 'Change Member Roles',
  'org:billing:view': 'View Billing & Subscriptions',
  'org:billing:edit': 'Modify Billing & Subscriptions',
  'documents:upload': 'Upload Documents',
  'documents:delete': 'Delete Documents',
  'documents:read': 'View & Search Documents',
  'ai:chat': 'Use AI Assistant Chat',
  'recommendations:dismiss': 'Dismiss AI Recommendations',
  'recommendations:read': 'View Recommendations',
  'analytics:view_sensitive': 'View Sensitive Financial Analytics',
  'analytics:read': 'View Standard Analytics',
};
