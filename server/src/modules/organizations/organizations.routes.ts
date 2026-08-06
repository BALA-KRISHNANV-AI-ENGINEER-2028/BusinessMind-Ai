/**
 * Organizations Routes. Mounted at /api/v1/organizations.
 */

import { Router } from 'express';
import { organizationsController } from './organizations.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { updateOrganizationSchema, inviteMemberSchema, updateMemberRoleSchema } from './organizations.validator';
import { PERMISSIONS } from '../../constants/app.constants';

export const organizationsRouter = Router();

organizationsRouter.use(authenticate);

// Active organization context endpoints
organizationsRouter.get('/current',                            organizationsController.getCurrent);
organizationsRouter.patch('/current',                          requirePermission(PERMISSIONS.ORG_SETTINGS_EDIT), validate(updateOrganizationSchema), organizationsController.update);
organizationsRouter.get('/current/members',                    organizationsController.getMembers);
organizationsRouter.post('/current/members/invite',            requirePermission(PERMISSIONS.ORG_MEMBERS_INVITE), validate(inviteMemberSchema), organizationsController.inviteMember);
organizationsRouter.post('/invitations',                       requirePermission(PERMISSIONS.ORG_MEMBERS_INVITE), validate(inviteMemberSchema), organizationsController.inviteMember);

// ID-parameterized organization endpoints
organizationsRouter.get('/:id',                                organizationsController.getById);
organizationsRouter.patch('/:id',                              requirePermission(PERMISSIONS.ORG_SETTINGS_EDIT), validate(updateOrganizationSchema), organizationsController.update);
organizationsRouter.put('/:id',                                requirePermission(PERMISSIONS.ORG_SETTINGS_EDIT), validate(updateOrganizationSchema), organizationsController.update);
organizationsRouter.get('/:id/members',                        organizationsController.getMembers);
organizationsRouter.post('/:id/members/invite',                requirePermission(PERMISSIONS.ORG_MEMBERS_INVITE), validate(inviteMemberSchema), organizationsController.inviteMember);
organizationsRouter.patch('/:id/members/:memberId/role',       requirePermission(PERMISSIONS.ORG_MEMBERS_CHANGE_ROLE), validate(updateMemberRoleSchema), organizationsController.updateMemberRole);
organizationsRouter.delete('/:id/members/:memberId',           requirePermission(PERMISSIONS.ORG_MEMBERS_REMOVE), organizationsController.removeMember);
