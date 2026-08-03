/**
 * Role-based authorization middleware.
 *
 * Guards routes by checking req.user.role against an allowed roles list.
 * Must be used AFTER the authenticate middleware.
 *
 * @example
 * // Only org_admin and super_admin can access this route:
 * router.delete(
 *   '/:id',
 *   authenticate,
 *   authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN),
 *   asyncHandler(orgController.deleteOrganization),
 * );
 */

import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../constants/app.constants';
import { ForbiddenError, UnauthorizedError } from '../errors/HttpErrors';
import { ErrorCode } from '../constants/http.constants';

/**
 * Returns middleware that checks if req.user.role is in the allowed roles.
 *
 * @param allowedRoles - One or more roles that may access this route.
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}.`,
          ErrorCode.INSUFFICIENT_ROLE,
        ),
      );
    }

    next();
  };
}

/**
 * Convenience guard — requires the user to be a super_admin.
 */
export const requireSuperAdmin = authorize('super_admin');

/**
 * Convenience guard — requires the user to be an org_admin or super_admin.
 */
export const requireAdmin = authorize('super_admin', 'org_admin');

/**
 * Convenience guard — requires manager level or higher.
 */
export const requireManager = authorize('super_admin', 'org_admin', 'manager');
