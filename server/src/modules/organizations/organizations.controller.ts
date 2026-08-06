/**
 * Organizations Controller.
 *
 * Controllers for Organization management, members, invitations, and role management.
 */

import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async.util';
import { sendSuccess, sendNoContent } from '../../utils/response.util';
import { organizationsService } from './organizations.service';
import { parsePaginationQuery } from '../../utils/pagination.util';

export const organizationsController = {
  /** GET /api/v1/organizations/current */
  getCurrent: asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.organizationId;
    const org = await organizationsService.getById(orgId);
    sendSuccess(res, org, 'Active organization context fetched');
  }),

  /** GET /api/v1/organizations/:id */
  getById: asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.params['id'] === 'current' ? req.user!.organizationId : req.params['id']!;
    const org = await organizationsService.getById(orgId);
    sendSuccess(res, org);
  }),

  /** GET /api/v1/organizations/:id/members */
  getMembers: asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.params['id'] === 'current' ? req.user!.organizationId : req.params['id']!;
    const pagination = parsePaginationQuery(req.query as Record<string, string>);
    const result = await organizationsService.getMembers(orgId, pagination);
    sendSuccess(res, result);
  }),

  /** PATCH /api/v1/organizations/:id */
  update: asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.params['id'] === 'current' ? req.user!.organizationId : req.params['id']!;
    const org = await organizationsService.update(orgId, req.body);
    sendSuccess(res, org, 'Organization updated successfully');
  }),

  /** POST /api/v1/organizations/:id/members/invite */
  inviteMember: asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.params['id'] === 'current' ? req.user!.organizationId : req.params['id']!;
    const invite = await organizationsService.inviteMember(orgId, req.body, req.user!.id);
    sendSuccess(res, invite, 'Invitation sent successfully');
  }),

  /** PATCH /api/v1/organizations/:id/members/:memberId/role */
  updateMemberRole: asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.params['id'] === 'current' ? req.user!.organizationId : req.params['id']!;
    const member = await organizationsService.updateMemberRole(orgId, req.params['memberId']!, req.body);
    sendSuccess(res, member, 'Member role updated');
  }),

  /** DELETE /api/v1/organizations/:id/members/:memberId */
  removeMember: asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.params['id'] === 'current' ? req.user!.organizationId : req.params['id']!;
    await organizationsService.removeMember(orgId, req.params['memberId']!);
    sendNoContent(res);
  }),
};
