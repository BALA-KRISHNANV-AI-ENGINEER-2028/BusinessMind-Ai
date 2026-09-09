import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { HttpStatus } from '../../constants/http.constants';

export class DashboardController {
  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const metrics = await dashboardService.getMetrics(orgId);
      res.status(HttpStatus.OK).json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  }

  async getAgents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const agents = await dashboardService.getAgentStatuses(orgId);
      res.status(HttpStatus.OK).json({ success: true, data: agents });
    } catch (err) {
      next(err);
    }
  }

  async getDecisions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const decisions = await dashboardService.getRecentDecisions(orgId);
      res.status(HttpStatus.OK).json({ success: true, data: decisions });
    } catch (err) {
      next(err);
    }
  }

  async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const recommendations = await dashboardService.getDashboardRecommendations(orgId);
      res.status(HttpStatus.OK).json({ success: true, data: recommendations });
    } catch (err) {
      next(err);
    }
  }

  async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const documents = await dashboardService.getRecentDocuments(orgId);
      res.status(HttpStatus.OK).json({ success: true, data: documents });
    } catch (err) {
      next(err);
    }
  }
}

export const dashboardController = new DashboardController();
