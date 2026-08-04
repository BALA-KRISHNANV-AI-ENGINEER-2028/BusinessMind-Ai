/**
 * Documents Routes. Mounted at /api/v1/documents
 */

import { Router } from 'express';
import { documentsController } from './documents.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { listDocumentsQuerySchema, updateDocumentSchema } from './documents.validator';
import { PERMISSIONS } from '../../constants/app.constants';

export const documentsRouter = Router();

documentsRouter.use(authenticate);

documentsRouter.get('/',     requirePermission(PERMISSIONS.DOCUMENTS_READ), validate(listDocumentsQuerySchema), documentsController.getAll);
documentsRouter.get('/:id',  requirePermission(PERMISSIONS.DOCUMENTS_READ), documentsController.getById);
// POST /upload — Phase 6+: Multer middleware + upload service
documentsRouter.put('/:id',  requirePermission(PERMISSIONS.DOCUMENTS_UPLOAD), validate(updateDocumentSchema), documentsController.update);
documentsRouter.delete('/:id', requirePermission(PERMISSIONS.DOCUMENTS_DELETE), documentsController.delete);
