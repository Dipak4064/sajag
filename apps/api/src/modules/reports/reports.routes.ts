import { Router } from 'express';
import multer from 'multer';
import { reportsController } from './reports.controller';

export const reportsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

reportsRouter.post('/', upload.array('photos', 5), reportsController.createReport);
reportsRouter.get('/', reportsController.getAllReports);
reportsRouter.patch('/:id/verify', reportsController.verifyReport);
