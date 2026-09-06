import { Request, Response, NextFunction } from 'express';
import { adsRepository, AdsRepository } from './ads.repository';
import { storageService } from '../files/storage.service';
import { logger } from '../../shared/logging/logger';

export class AdsController {
  constructor(private repo: AdsRepository = adsRepository) {}

  public getPublicAds = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { placement, category } = req.query;

      const where: any = { isActive: true };
      if (placement) where.placement = String(placement);
      if (category) where.category = String(category);

      const ads = await this.repo.findActiveAds(where);

      if (ads.length > 0) {
        const ids = ads.map((a: any) => a.id);
        this.repo.incrementImpressions(ids).catch((e: any) => logger.warn(`Failed to increment impressions: ${e.message}`));
      }

      res.json({ success: true, data: ads });
    } catch (err) {
      next(err);
    }
  };

  public getAdminAds = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const ads = await this.repo.findAllAds();
      const enriched = ads.map((ad: any) => ({
        ...ad,
        ctr: ad.impressions > 0 ? Number(((ad.clicks / ad.impressions) * 100).toFixed(2)) : 0
      }));

      res.json({ success: true, data: enriched });
    } catch (err) {
      next(err);
    }
  };

  public getAdById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ad = await this.repo.findAdById(req.params.id);
      if (!ad) {
        return res.status(404).json({ success: false, message: 'Advertisement not found' });
      }
      res.json({ success: true, data: ad });
    } catch (err) {
      next(err);
    }
  };

  public createAd = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let imageUrl = req.body.imageUrl;

      if (req.file) {
        const uploadResult = await storageService.uploadFile(req.file, 'ads');
        imageUrl = uploadResult.url;
      }

      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          message: 'Image is required. Provide an uploaded image file or imageUrl string.'
        });
      }

      const {
        title,
        description,
        targetUrl,
        category = 'PSA',
        placement = 'CITIZEN_BANNER',
        priority = 1,
        isActive = true,
        startDate,
        endDate
      } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, message: 'Title is required' });
      }

      const ad = await this.repo.createAd({
        title,
        description,
        imageUrl,
        targetUrl,
        category,
        placement,
        priority: Number(priority) || 1,
        isActive: isActive === 'true' || isActive === true,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : undefined
      });

      logger.info(`Created new Advertisement/Notice [${ad.id}]: ${ad.title} (Asset stored on RustFS)`);
      res.status(201).json({ success: true, data: ad });
    } catch (err) {
      next(err);
    }
  };

  public recordClick = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ad = await this.repo.incrementClicks(req.params.id);
      res.json({ success: true, data: { clicks: ad.clicks, targetUrl: ad.targetUrl } });
    } catch (err) {
      next(err);
    }
  };

  public updateAd = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description, targetUrl, category, placement, priority, isActive } = req.body;

      const data: any = {};
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      if (targetUrl !== undefined) data.targetUrl = targetUrl;
      if (category !== undefined) data.category = category;
      if (placement !== undefined) data.placement = placement;
      if (priority !== undefined) data.priority = Number(priority);
      if (isActive !== undefined) data.isActive = Boolean(isActive);

      const updated = await this.repo.updateAd(req.params.id, data);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  public deleteAd = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ad = await this.repo.findAdById(req.params.id);
      if (!ad) {
        return res.status(404).json({ success: false, message: 'Advertisement not found' });
      }

      if (ad.imageUrl.startsWith('/api/files/')) {
        const key = ad.imageUrl.replace('/api/files/', '');
        await storageService.deleteFile(key).catch((e) => logger.warn(`Could not delete RustFS asset: ${e.message}`));
      }

      await this.repo.deleteAd(req.params.id);
      res.json({ success: true, message: 'Advertisement deleted successfully' });
    } catch (err) {
      next(err);
    }
  };
}

export const adsController = new AdsController();
