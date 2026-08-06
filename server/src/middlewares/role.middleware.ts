/**
 * Role-Based Access Control (RBAC) Role Middleware.
 *
 * Enforces role level access requirements on routes.
 */

import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../constants/app.constants';
import { ForbiddenError, UnauthorizedError } from '../errors/HttpErrors';

/**
 * Restricts access to users having one of the allowed roles.
 *
 * @example
 * router.post('/members', requireAuth, requireRole('super_admin', 'org_admin'), handler);
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Action requires one of the following roles: ${allowedRoles.join(', ')}.`,
        ),
      );
    }

    next();
  };
}
