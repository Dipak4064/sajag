import { Router } from 'express';
import { rescueController } from './rescue.controller';

export const rescueRouter = Router();

rescueRouter.get('/teams', rescueController.getTeams);
rescueRouter.get('/nearest', rescueController.getNearestTeams);
