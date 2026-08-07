/**
 * Documents Module — Express Routes.
 *
 * REST Endpoints:
 *   POST   /api/v1/documents               → Upload Document (multipart/form-data)
 *   GET    /api/v1/documents               → List Documents
 *   GET    /api/v1/documents/:id           → View Document Details
 *   PATCH  /api/v1/documents/:id           → Update Document Metadata
 *   DELETE /api/v1/documents/:id           → Soft Delete Document
 *   GET    /api/v1/documents/:id/status    → Get Processing Status & Progress
 *   GET    /api/v1/documents/:id/download  → Download Document Content
 *   POST   /api/v1/documents/:id/reprocess → Trigger Reprocessing
 */

import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { documentUploadMiddleware } from '../../middlewares/upload.middleware';
import { PERMISSIONS } from '../../constants/app.constants';
import { documentsController } from './documents.controller';

export const documentsRouter = Router();

documentsRouter.use(requireAuth);

documentsRouter.post(
  '/',
  requirePermission(PERMISSIONS.DOCUMENTS_UPLOAD),
  documentUploadMiddleware.single('file'),
  documentsController.upload.bind(documentsController),
);

documentsRouter.get(
  '/',
  requirePermission(PERMISSIONS.DOCUMENTS_READ),
  documentsController.getAll.bind(documentsController),
);

documentsRouter.get(
  '/:id',
  requirePermission(PERMISSIONS.DOCUMENTS_READ),
  documentsController.getById.bind(documentsController),
);

documentsRouter.patch(
  '/:id',
  requirePermission(PERMISSIONS.DOCUMENTS_UPLOAD),
  documentsController.update.bind(documentsController),
);

documentsRouter.delete(
  '/:id',
  requirePermission(PERMISSIONS.DOCUMENTS_DELETE),
  documentsController.delete.bind(documentsController),
);

documentsRouter.get(
  '/:id/status',
  requirePermission(PERMISSIONS.DOCUMENTS_READ),
  documentsController.getStatus.bind(documentsController),
);

documentsRouter.get(
  '/:id/download',
  requirePermission(PERMISSIONS.DOCUMENTS_READ),
  documentsController.download.bind(documentsController),
);

documentsRouter.post(
  '/:id/reprocess',
  requirePermission(PERMISSIONS.DOCUMENTS_UPLOAD),
  documentsController.reprocess.bind(documentsController),
);
