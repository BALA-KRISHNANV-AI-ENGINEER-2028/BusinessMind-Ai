/**
 * Retrieval Controller — Phase 7: RAG Foundation.
 *
 * Handles HTTP requests for evidence search.
 * Extracts authenticated user context (organizationId, userId) from req.user
 * to enforce multi-tenant isolation.
 */

import type { Request, Response, NextFunction } from 'express';
import { retrievalService } from './retrieval.service';
import { searchEvidenceSchema } from './retrieval.validator';
import { UnauthorizedError } from '../../errors/HttpErrors';
import { HttpStatus } from '../../constants/http.constants';

export class RetrievalController {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new UnauthorizedError('Authentication required with valid organization context.');
      }

      const body = searchEvidenceSchema.parse(req.body);

      const data = await retrievalService.searchEvidence(
        req.user.organizationId,
        req.user.id,
        body,
      );

      res.status(HttpStatus.OK).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const retrievalController = new RetrievalController();
