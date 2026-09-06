import { Router } from 'express';
import multer from 'multer';
import { adsController } from './ads.controller';

export const adsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

adsRouter.get('/', adsController.getPublicAds);
adsRouter.get('/admin', adsController.getAdminAds);
adsRouter.get('/:id', adsController.getAdById);
adsRouter.post('/', upload.single('image'), adsController.createAd);
adsRouter.post('/:id/click', adsController.recordClick);
adsRouter.patch('/:id', adsController.updateAd);
adsRouter.delete('/:id', adsController.deleteAd);
