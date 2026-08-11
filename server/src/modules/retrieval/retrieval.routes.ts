/**
 * Retrieval Module — Express Routes.
 *
 * REST Endpoints:
 *   POST /api/v1/retrieval/search → Semantic evidence search across embedded document chunks
 */

import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { PERMISSIONS } from '../../constants/app.constants';
import { retrievalController } from './retrieval.controller';

export const retrievalRouter = Router();

retrievalRouter.use(requireAuth);

retrievalRouter.post(
  '/search',
  requirePermission(PERMISSIONS.DOCUMENTS_READ),
  retrievalController.search.bind(retrievalController),
);
