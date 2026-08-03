/**
 * Application-wide constants.
 *
 * Mirrors the domain language established in the frontend types
 * (src/types/auth.ts, src/types/organization.ts, src/types/rbac.ts)
 * so that the two layers stay aligned.
 *
 * Keep this file free of imports — it must be safe to import anywhere.
 */

// ─── RBAC Roles ───────────────────────────────────────────────────────────────

/**
 * Organisation member roles, ordered from most to least privileged.
 * Mirrors frontend OrgMemberRole type exactly.
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin',
  MANAGER: 'manager',
  ANALYST: 'analyst',
  EMPLOYEE: 'employee',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ORG_ADMIN,
  ROLES.MANAGER,
  ROLES.ANALYST,
  ROLES.EMPLOYEE,
];

/** Roles with elevated organisation management privileges. */
export const ADMIN_ROLES: Role[] = [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN];

// ─── Permissions ──────────────────────────────────────────────────────────────

/**
 * Fine-grained permission strings.
 * Mirrors frontend Permission type exactly.
 */
export const PERMISSIONS = {
  // Organisation management
  ORG_SETTINGS_EDIT: 'org:settings:edit',
  ORG_MEMBERS_INVITE: 'org:members:invite',
  ORG_MEMBERS_REMOVE: 'org:members:remove',
  ORG_MEMBERS_CHANGE_ROLE: 'org:members:change_role',
  ORG_BILLING_VIEW: 'org:billing:view',
  ORG_BILLING_EDIT: 'org:billing:edit',

  // Documents
  DOCUMENTS_UPLOAD: 'documents:upload',
  DOCUMENTS_DELETE: 'documents:delete',
  DOCUMENTS_READ: 'documents:read',

  // AI & Analytics
  AI_CHAT: 'ai:chat',
  RECOMMENDATIONS_DISMISS: 'recommendations:dismiss',
  RECOMMENDATIONS_READ: 'recommendations:read',
  ANALYTICS_VIEW_SENSITIVE: 'analytics:view_sensitive',
  ANALYTICS_READ: 'analytics:read',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Role → Permission matrix.
 * Used by the permission middleware to gate routes.
 * Mirrors rbac.constants.ts on the frontend.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS) as Permission[],

  [ROLES.ORG_ADMIN]: [
    PERMISSIONS.ORG_SETTINGS_EDIT,
    PERMISSIONS.ORG_MEMBERS_INVITE,
    PERMISSIONS.ORG_MEMBERS_REMOVE,
    PERMISSIONS.ORG_MEMBERS_CHANGE_ROLE,
    PERMISSIONS.ORG_BILLING_VIEW,
    PERMISSIONS.ORG_BILLING_EDIT,
    PERMISSIONS.DOCUMENTS_UPLOAD,
    PERMISSIONS.DOCUMENTS_DELETE,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.AI_CHAT,
    PERMISSIONS.RECOMMENDATIONS_DISMISS,
    PERMISSIONS.RECOMMENDATIONS_READ,
    PERMISSIONS.ANALYTICS_VIEW_SENSITIVE,
    PERMISSIONS.ANALYTICS_READ,
  ],

  [ROLES.MANAGER]: [
    PERMISSIONS.ORG_MEMBERS_INVITE,
    PERMISSIONS.ORG_BILLING_VIEW,
    PERMISSIONS.DOCUMENTS_UPLOAD,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.AI_CHAT,
    PERMISSIONS.RECOMMENDATIONS_DISMISS,
    PERMISSIONS.RECOMMENDATIONS_READ,
    PERMISSIONS.ANALYTICS_READ,
  ],

  [ROLES.ANALYST]: [
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.AI_CHAT,
    PERMISSIONS.RECOMMENDATIONS_READ,
    PERMISSIONS.ANALYTICS_READ,
  ],

  [ROLES.EMPLOYEE]: [
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.AI_CHAT,
    PERMISSIONS.RECOMMENDATIONS_READ,
  ],
};

// ─── Organisation Plans ───────────────────────────────────────────────────────

export const ORG_PLANS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export type OrgPlan = (typeof ORG_PLANS)[keyof typeof ORG_PLANS];

// ─── Member Status ────────────────────────────────────────────────────────────

export const MEMBER_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
} as const;

export type MemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];

// ─── Document Status ──────────────────────────────────────────────────────────

export const DOCUMENT_STATUS = {
  PROCESSED: 'processed',
  PROCESSING: 'processing',
  FAILED: 'failed',
} as const;

export type DocumentStatus = (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];

// ─── File Upload ──────────────────────────────────────────────────────────────

export const FILE_UPLOAD = {
  MAX_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB
  ACCEPTED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ] as const,
} as const;

// ─── Pagination Defaults ──────────────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

// ─── Token Lifetimes (ms) ─────────────────────────────────────────────────────

export const TOKEN_TTL = {
  ACCESS_TOKEN_MS: 15 * 60 * 1000,         // 15 minutes
  REFRESH_TOKEN_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  INVITE_LINK_MS: 48 * 60 * 60 * 1000,     // 48 hours
} as const;

// ─── bcrypt ───────────────────────────────────────────────────────────────────

export const BCRYPT_SALT_ROUNDS = 12;

// ─── App Identity ─────────────────────────────────────────────────────────────

export const APP = {
  NAME: 'BusinessMind AI',
  VERSION: '1.0.0',
  DESCRIPTION: 'Enterprise AI-Powered Business Intelligence Platform',
} as const;
