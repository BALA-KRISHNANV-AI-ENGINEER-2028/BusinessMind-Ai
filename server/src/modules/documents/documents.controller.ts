/**
 * Documents Controller.
 *
 * HTTP Controller for document upload, listing, filtering, details, updates, soft deletion,
 * state machine progress, download, and reprocessing.
 */

import type { Request, Response, NextFunction } from 'express';
import { documentsService } from './documents.service';
import { updateDocumentSchema, documentQuerySchema } from './documents.validator';
import { HttpStatus } from '../../constants/http.constants';
import { AppError } from '../../errors/AppError';

export class DocumentsController {
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError('No file provided for upload.', HttpStatus.BAD_REQUEST, 'NO_FILE_PROVIDED', true);
      }

      const knowledgeBaseId = req.body.knowledgeBaseId as string | undefined;

      const doc = await documentsService.upload(
        req.user!.organizationId,
        req.user!.id,
        req.file,
        knowledgeBaseId,
      );

      res.status(HttpStatus.CREATED).json({
        success: true,
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = documentQuerySchema.parse(req.query);
      const result = await documentsService.getAll(req.user!.organizationId, query);
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
      const doc = await documentsService.getById(
        req.user!.organizationId,
        req.params['id'] as string,
      );
      res.status(HttpStatus.OK).json({
        success: true,
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = updateDocumentSchema.parse(req.body);
      const doc = await documentsService.update(
        req.user!.organizationId,
        req.user!.id,
        req.params['id'] as string,
        validated,
      );
      res.status(HttpStatus.OK).json({
        success: true,
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await documentsService.delete(
        req.user!.organizationId,
        req.user!.id,
        req.params['id'] as string,
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Document deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const statusInfo = await documentsService.getStatus(
        req.user!.organizationId,
        req.params['id'] as string,
      );
      res.status(HttpStatus.OK).json({
        success: true,
        data: statusInfo,
      });
    } catch (err) {
      next(err);
    }
  }

  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { stream, doc } = await documentsService.getDownloadStream(
        req.user!.organizationId,
        req.params['id'] as string,
      );

      res.setHeader('Content-Type', doc.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(doc.displayName)}"`,
      );

      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  async reprocess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await documentsService.reprocess(
        req.user!.organizationId,
        req.user!.id,
        req.params['id'] as string,
      );
      res.status(HttpStatus.OK).json({
        success: true,
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const documentsController = new DocumentsController();
