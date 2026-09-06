import { Router } from 'express';
import { sheltersController } from './shelters.controller';

export const sheltersRouter = Router();

sheltersRouter.get('/', sheltersController.getAllShelters);
sheltersRouter.get('/nearest', sheltersController.getNearestShelters);
