import { Router } from 'express';
import { alertsController } from './alerts.controller';

export const alertsRouter = Router();

alertsRouter.get('/', alertsController.getAllAlerts);
alertsRouter.get('/active', alertsController.getActiveAlerts);
alertsRouter.get('/:id/twiml', alertsController.getTwiml);
alertsRouter.post('/:id/response', alertsController.handleUserResponse);
alertsRouter.post('/:id/voice-upload', alertsController.handleVoiceUpload);
