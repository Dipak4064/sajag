import { Router } from 'express';
import { devicesController } from './devices.controller';

export const devicesRouter = Router();

devicesRouter.get('/', devicesController.getAllDevices);
devicesRouter.get('/:id', devicesController.getDeviceById);
devicesRouter.get('/:id/readings', devicesController.getDeviceReadings);
