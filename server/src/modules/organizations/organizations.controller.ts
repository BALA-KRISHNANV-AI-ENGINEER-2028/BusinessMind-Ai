/**
 * Organizations Controller.
 */

import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async.util';
import { sendSuccess, sendNoContent } from '../../utils/response.util';
import { organizationsService } from './organizations.service';
import { parsePaginationQuery } from '../../utils/pagination.util';

export const organizationsController = {
  /** GET /api/v1/organizations/:id */
  getById: asyncHandler(async (req: Request, res: Response) => {
    const org = await organizationsService.getById(req.params['id']!);
    sendSuccess(res, org);
  }),

  /** GET /api/v1/organizations/:id/members */
  getMembers: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePaginationQuery(req.query as Record<string, string>);
    const result = await organizationsService.getMembers(req.params['id']!, pagination);
    sendSuccess(res, result);
  }),

  /** PUT /api/v1/organizations/:id */
  update: asyncHandler(async (req: Request, res: Response) => {
    const org = await organizationsService.update(req.params['id']!, req.body);
    sendSuccess(res, org, 'Organisation updated successfully');
  }),

  /** POST /api/v1/organizations/:id/members/invite */
  inviteMember: asyncHandler(async (req: Request, res: Response) => {
    const invite = await organizationsService.inviteMember(req.params['id']!, req.body, req.user!.id);
    sendSuccess(res, invite, 'Invitation sent successfully');
  }),

  /** PATCH /api/v1/organizations/:id/members/:memberId/role */
  updateMemberRole: asyncHandler(async (req: Request, res: Response) => {
    const member = await organizationsService.updateMemberRole(req.params['id']!, req.params['memberId']!, req.body);
    sendSuccess(res, member, 'Member role updated');
  }),

  /** DELETE /api/v1/organizations/:id/members/:memberId */
  removeMember: asyncHandler(async (req: Request, res: Response) => {
    await organizationsService.removeMember(req.params['id']!, req.params['memberId']!);
    sendNoContent(res);
  }),
};
