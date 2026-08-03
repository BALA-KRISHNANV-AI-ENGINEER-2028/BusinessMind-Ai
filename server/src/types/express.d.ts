/**
 * Express Request / Response type augmentations.
 *
 * Extends the Express namespace to add strongly-typed fields
 * that middleware attaches to every request object.
 *
 * This file must be included in tsconfig.json "include" so that
 * TypeScript merges these declarations globally.
 */

import type { Role, Permission } from '../constants/app.constants';

declare global {
  namespace Express {
    /**
     * Augmented Request — available in every controller after auth middleware runs.
     */
    interface Request {
      /**
       * UUID string attached by RequestIdMiddleware.
       * Propagated in X-Request-ID response header for tracing.
       */
      requestId: string;

      /**
       * Authenticated user payload.
       * Populated by the `authenticate` middleware from the decoded JWT.
       * Undefined on public routes.
       */
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Shape of the authenticated user available on req.user.
 * Populated from the JWT payload — not a full DB document.
 */
export interface AuthenticatedUser {
  /** MongoDB ObjectId as string. */
  id: string;
  email: string;
  fullName: string;
  /** The organisation this token was issued for (multi-tenancy). */
  organizationId: string;
  role: Role;
  permissions: Permission[];
}
