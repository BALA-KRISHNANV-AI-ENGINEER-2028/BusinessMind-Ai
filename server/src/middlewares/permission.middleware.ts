/**
 * Fine-grained permission middleware.
 *
 * Guards routes by checking req.user.permissions against a required set.
 * Must be used AFTER the authenticate middleware.
 *
 * Role middleware (authorize.middleware.ts) checks the user's role.
 * Permission middleware (this file) checks specific action permissions.
 *
 * Use roles for coarse-grained access (e.g. "only admins").
 * Use permissions for fine-grained access (e.g. "can upload documents").
 *
 * @example
 * router.post(
 *   '/upload',
 *   authenticate,
 *   requirePermission(PERMISSIONS.DOCUMENTS_UPLOAD),
 *   asyncHandler(documentsController.upload),
 * );
 */

import type { Request, Response, NextFunction } from 'express';
import type { Permission } from '../constants/app.constants';
import { ForbiddenError, UnauthorizedError } from '../errors/HttpErrors';
import { ErrorCode } from '../constants/http.constants';

/**
 * Returns middleware that verifies the user has ALL of the specified permissions.
 *
 * @param required - One or more permission strings that the user must have.
 */
export function requirePermission(...required: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    const userPerms = new Set(req.user.permissions);
    const missing = required.filter((p) => !userPerms.has(p));

    if (missing.length > 0) {
      return next(
        new ForbiddenError(
          `Insufficient permissions. Missing: ${missing.join(', ')}.`,
          ErrorCode.INSUFFICIENT_PERMISSION,
        ),
      );
    }

    next();
  };
}

/**
 * Returns middleware that verifies the user has AT LEAST ONE of the specified permissions.
 *
 * @param allowed - The user needs any one of these permissions.
 */
export function requireAnyPermission(...allowed: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    const userPerms = new Set(req.user.permissions);
    const hasAny = allowed.some((p) => userPerms.has(p));

    if (!hasAny) {
      return next(
        new ForbiddenError(
          `Insufficient permissions. Requires at least one of: ${allowed.join(', ')}.`,
          ErrorCode.INSUFFICIENT_PERMISSION,
        ),
      );
    }

    next();
  };
}
