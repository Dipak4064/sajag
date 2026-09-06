import { Router } from 'express';
import { sosController } from './sos.controller';

export const sosRouter = Router();

sosRouter.get('/', sosController.getAllSOS);
sosRouter.post('/', sosController.createSOS);
sosRouter.get('/active', sosController.getActiveSOS);
sosRouter.patch('/:id/status', sosController.updateSOSStatus);
sosRouter.post('/:id/assign', sosController.assignTeam);
