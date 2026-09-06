import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../db/prisma';
import { storageService } from '../services/storage.service';
import { logger } from '../utils/logger';

export const adsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// GET /api/ads - Public active announcements & ads
adsRouter.get('/', async (req, res, next) => {
  try {
    const { placement, category } = req.query;

    const where: any = { isActive: true };
    if (placement) where.placement = String(placement);
    if (category) where.category = String(category);

    const ads = await prisma.advertisement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    });

    // Record impressions asynchronously
    if (ads.length > 0) {
      const ids = ads.map((a) => a.id);
      prisma.advertisement
        .updateMany({
          where: { id: { in: ids } },
          data: { impressions: { increment: 1 } }
        })
        .catch((e) => logger.warn(`Failed to increment impressions: ${e.message}`));
    }

    res.json({ success: true, data: ads });
  } catch (err) {
    next(err);
  }
});

// GET /api/ads/admin - Full list for authority command dashboard with analytics
adsRouter.get('/admin', async (req, res, next) => {
  try {
    const ads = await prisma.advertisement.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const enriched = ads.map((ad) => ({
      ...ad,
      ctr: ad.impressions > 0 ? Number(((ad.clicks / ad.impressions) * 100).toFixed(2)) : 0
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

// GET /api/ads/:id - Single ad details
adsRouter.get('/:id', async (req, res, next) => {
  try {
    const ad = await prisma.advertisement.findUnique({
      where: { id: req.params.id }
    });

    if (!ad) {
      return res.status(404).json({ success: false, message: 'Advertisement not found' });
    }

    res.json({ success: true, data: ad });
  } catch (err) {
    next(err);
  }
});

// POST /api/ads - Create an ad/announcement with image uploaded directly to RustFS
adsRouter.post('/', upload.single('image'), async (req, res, next) => {
  try {
    let imageUrl = req.body.imageUrl;

    // If an image file was provided in multipart upload, save to RustFS
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

    const ad = await prisma.advertisement.create({
      data: {
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
      }
    });

    logger.info(`Created new Advertisement/Notice [${ad.id}]: ${ad.title} (Asset stored on RustFS)`);

    res.status(201).json({ success: true, data: ad });
  } catch (err) {
    next(err);
  }
});

// POST /api/ads/:id/click - Track click on ad banner
adsRouter.post('/:id/click', async (req, res, next) => {
  try {
    const ad = await prisma.advertisement.update({
      where: { id: req.params.id },
      data: { clicks: { increment: 1 } }
    });

    res.json({ success: true, data: { clicks: ad.clicks, targetUrl: ad.targetUrl } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/ads/:id - Update ad details or status
adsRouter.patch('/:id', async (req, res, next) => {
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

    const updated = await prisma.advertisement.update({
      where: { id: req.params.id },
      data
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/ads/:id - Delete ad
adsRouter.delete('/:id', async (req, res, next) => {
  try {
    const ad = await prisma.advertisement.findUnique({ where: { id: req.params.id } });
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Advertisement not found' });
    }

    // Attempt to delete associated asset from RustFS
    if (ad.imageUrl.startsWith('/api/files/')) {
      const key = ad.imageUrl.replace('/api/files/', '');
      await storageService.deleteFile(key).catch((e) => logger.warn(`Could not delete RustFS asset: ${e.message}`));
    }

    await prisma.advertisement.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'Advertisement deleted successfully' });
  } catch (err) {
    next(err);
  }
});
