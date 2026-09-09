import { Request, Response, NextFunction } from 'express';
import { decisionsService } from './decisions.service';
import { HttpStatus } from '../../constants/http.constants';

export class DecisionsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const limit = req.query['limit'] ? parseInt(String(req.query['limit']), 10) : 50;
      const offset = req.query['offset'] ? parseInt(String(req.query['offset']), 10) : 0;
      const decisions = await decisionsService.getAll(orgId, { limit, offset });
      res.status(HttpStatus.OK).json({ success: true, data: decisions });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const id = req.params['id'] as string;
      const decision = await decisionsService.getById(id, orgId);
      res.status(HttpStatus.OK).json({ success: true, data: decision });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const userId = req.user?.id || 'system';
      const decision = await decisionsService.create(orgId, userId, req.body);
      res.status(HttpStatus.CREATED).json({ success: true, data: decision });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const id = req.params['id'] as string;
      const decision = await decisionsService.update(id, orgId, req.body);
      res.status(HttpStatus.OK).json({ success: true, data: decision });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const id = req.params['id'] as string;
      await decisionsService.delete(id, orgId);
      res.status(HttpStatus.OK).json({ success: true, data: { deleted: true } });
    } catch (err) {
      next(err);
    }
  }
}

export const decisionsController = new DecisionsController();
