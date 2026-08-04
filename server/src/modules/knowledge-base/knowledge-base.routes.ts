/** Knowledge Base Routes. Mounted at /api/v1/knowledge-base */
import { Router } from 'express';
import { knowledgeBaseController } from './knowledge-base.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { listKnowledgeItemsQuerySchema, createKnowledgeItemSchema, updateKnowledgeItemSchema } from './knowledge-base.validator';
import { PERMISSIONS } from '../../constants/app.constants';

export const knowledgeBaseRouter = Router();
knowledgeBaseRouter.use(authenticate);

knowledgeBaseRouter.get('/', validate(listKnowledgeItemsQuerySchema), knowledgeBaseController.getAll);
knowledgeBaseRouter.get('/:id', knowledgeBaseController.getById);
knowledgeBaseRouter.post('/', requirePermission(PERMISSIONS.DOCUMENTS_UPLOAD), validate(createKnowledgeItemSchema), knowledgeBaseController.create);
knowledgeBaseRouter.put('/:id', requirePermission(PERMISSIONS.DOCUMENTS_UPLOAD), validate(updateKnowledgeItemSchema), knowledgeBaseController.update);
knowledgeBaseRouter.delete('/:id', requirePermission(PERMISSIONS.DOCUMENTS_DELETE), knowledgeBaseController.delete);
