import { Router } from 'express';
import { telemetryController } from './telemetry.controller';

export const transportsRouter = Router();

transportsRouter.get('/status', telemetryController.getStatus);
transportsRouter.post('/lora', telemetryController.handleLoRaIngress);
