import { Router } from 'express';
import { decisionsController } from './decisions.controller';
import { authenticate } from '../../middlewares/auth.middleware';

export const decisionsRouter = Router();

decisionsRouter.use(authenticate);

decisionsRouter.get('/', decisionsController.getAll);
decisionsRouter.post('/', decisionsController.create);
decisionsRouter.get('/:id', decisionsController.getById);
decisionsRouter.patch('/:id', decisionsController.update);
decisionsRouter.delete('/:id', decisionsController.delete);
