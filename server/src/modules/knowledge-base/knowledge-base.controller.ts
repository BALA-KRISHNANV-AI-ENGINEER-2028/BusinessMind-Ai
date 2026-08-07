/**
 * Knowledge Base Controller.
 *
 * Handles HTTP requests for Knowledge Base CRUD & document association operations.
 */

import type { Request, Response, NextFunction } from 'express';
import { knowledgeBaseService } from './knowledge-base.service';
import {
  createKnowledgeBaseSchema,
  updateKnowledgeBaseSchema,
  knowledgeBaseQuerySchema,
  addDocumentToKBSchema,
} from './knowledge-base.validator';
import { HttpStatus } from '../../constants/http.constants';

export class KnowledgeBaseController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createKnowledgeBaseSchema.parse(req.body);
      const kb = await knowledgeBaseService.create(
        req.user!.organizationId,
        req.user!.id,
        validated,
      );
      res.status(HttpStatus.CREATED).json({
        success: true,
        data: kb,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = knowledgeBaseQuerySchema.parse(req.query);
      const result = await knowledgeBaseService.getAll(req.user!.organizationId, query);
      res.status(HttpStatus.OK).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kb = await knowledgeBaseService.getById(
        req.user!.organizationId,
        req.params['id'] as string,
      );
      res.status(HttpStatus.OK).json({
        success: true,
        data: kb,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = updateKnowledgeBaseSchema.parse(req.body);
      const kb = await knowledgeBaseService.update(
        req.user!.organizationId,
        req.user!.id,
        req.params['id'] as string,
        validated,
      );
      res.status(HttpStatus.OK).json({
        success: true,
        data: kb,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await knowledgeBaseService.delete(
        req.user!.organizationId,
        req.user!.id,
        req.params['id'] as string,
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Knowledge base deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  async addDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = addDocumentToKBSchema.parse(req.body);
      const doc = await knowledgeBaseService.addDocument(
        req.user!.organizationId,
        req.user!.id,
        req.params['id'] as string,
        validated.documentId,
      );
      res.status(HttpStatus.OK).json({
        success: true,
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  }

  async removeDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await knowledgeBaseService.removeDocument(
        req.user!.organizationId,
        req.user!.id,
        req.params['id'] as string,
        req.params['documentId'] as string,
      );
      res.status(HttpStatus.OK).json({
        success: true,
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  }

  async getKBDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query['page'] ? Number(req.query['page']) : 1;
      const pageSize = req.query['pageSize'] ? Number(req.query['pageSize']) : 10;
      const result = await knowledgeBaseService.getKBDocuments(
        req.user!.organizationId,
        req.params['id'] as string,
        { page, pageSize },
      );
      res.status(HttpStatus.OK).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const knowledgeBaseController = new KnowledgeBaseController();
