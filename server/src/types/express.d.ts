/**
 * Express Request / Response type augmentations.
 *
 * Extends both Express.Request and express-serve-static-core Request
 * so that req.requestId and req.user are recognized everywhere.
 */

import type { Role, Permission } from '../constants/app.constants';

/**
 * Shape of the authenticated user available on req.user.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  organizationId: string;
  role: Role;
  permissions: Permission[];
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: AuthenticatedUser;
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
    user?: AuthenticatedUser;
  }
}
