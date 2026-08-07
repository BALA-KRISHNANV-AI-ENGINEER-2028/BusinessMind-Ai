/**
 * Knowledge Base Module — Express Routes.
 *
 * REST Endpoints:
 *   POST   /api/v1/knowledge-base            → Create Knowledge Base
 *   GET    /api/v1/knowledge-base            → List Knowledge Bases
 *   GET    /api/v1/knowledge-base/:id        → View Knowledge Base
 *   PATCH  /api/v1/knowledge-base/:id        → Update Knowledge Base
 *   DELETE /api/v1/knowledge-base/:id        → Delete Knowledge Base
 *   POST   /api/v1/knowledge-base/:id/documents → Link Document to KB
 *   GET    /api/v1/knowledge-base/:id/documents → List KB Documents
 *   DELETE /api/v1/knowledge-base/:id/documents/:documentId → Unlink Document from KB
 */

import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { PERMISSIONS } from '../../constants/app.constants';
import { knowledgeBaseController } from './knowledge-base.controller';

export const knowledgeBaseRouter = Router();

knowledgeBaseRouter.use(requireAuth);

knowledgeBaseRouter.post(
  '/',
  requirePermission(PERMISSIONS.DOCUMENTS_UPLOAD),
  knowledgeBaseController.create.bind(knowledgeBaseController),
);

knowledgeBaseRouter.get(
  '/',
  requirePermission(PERMISSIONS.DOCUMENTS_READ),
  knowledgeBaseController.getAll.bind(knowledgeBaseController),
);

knowledgeBaseRouter.get(
  '/:id',
  requirePermission(PERMISSIONS.DOCUMENTS_READ),
  knowledgeBaseController.getById.bind(knowledgeBaseController),
);

knowledgeBaseRouter.patch(
  '/:id',
  requirePermission(PERMISSIONS.DOCUMENTS_UPLOAD),
  knowledgeBaseController.update.bind(knowledgeBaseController),
);

knowledgeBaseRouter.delete(
  '/:id',
  requirePermission(PERMISSIONS.DOCUMENTS_DELETE),
  knowledgeBaseController.delete.bind(knowledgeBaseController),
);

knowledgeBaseRouter.post(
  '/:id/documents',
  requirePermission(PERMISSIONS.DOCUMENTS_UPLOAD),
  knowledgeBaseController.addDocument.bind(knowledgeBaseController),
);

knowledgeBaseRouter.get(
  '/:id/documents',
  requirePermission(PERMISSIONS.DOCUMENTS_READ),
  knowledgeBaseController.getKBDocuments.bind(knowledgeBaseController),
);

knowledgeBaseRouter.delete(
  '/:id/documents/:documentId',
  requirePermission(PERMISSIONS.DOCUMENTS_DELETE),
  knowledgeBaseController.removeDocument.bind(knowledgeBaseController),
);
