/**
 * Permission-Based Access Control Middleware.
 *
 * Enforces fine-grained permission string requirements on routes.
 */

import type { Request, Response, NextFunction } from 'express';
import type { Permission } from '../constants/app.constants';
import { ForbiddenError, UnauthorizedError } from '../errors/HttpErrors';

/**
 * Restricts access to users holding all (or any) of the required permissions.
 *
 * @example
 * router.patch('/settings', requireAuth, requirePermission('org:settings:edit'), handler);
 */
export function requirePermission(...requiredPermissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userPermissions = req.user.permissions ?? [];
    const hasAll = requiredPermissions.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      return next(
        new ForbiddenError(
          `Insufficient permissions. Required: ${requiredPermissions.join(', ')}.`,
        ),
      );
    }

    next();
  };
}
