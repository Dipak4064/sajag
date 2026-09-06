import { Router } from 'express';
import { prisma } from '../db/prisma';
import { WebSocketService } from '../websocket/socket.server';
import { citizenReportCreateSchema } from '@sajag/validation';

export const reportsRouter = Router();
const ws = WebSocketService.getInstance();

import multer from 'multer';
import { storageService } from '../services/storage.service';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

// POST /api/reports
reportsRouter.post('/', upload.array('photos', 5), async (req, res, next) => {
  try {
    let mediaUrls: string[] = [];

    // 1. Process directly uploaded photos if any
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const uploaded = await Promise.all(
        files.map((file) => storageService.uploadFile(file, 'reports'))
      );
      mediaUrls = uploaded.map((u) => u.url);
    }

    // 2. Parse body fields (from JSON or multipart form-data)
    let bodyData = { ...req.body };
    if (typeof bodyData.latitude === 'string') bodyData.latitude = parseFloat(bodyData.latitude);
    if (typeof bodyData.longitude === 'string') bodyData.longitude = parseFloat(bodyData.longitude);
    if (typeof bodyData.mediaUrls === 'string') {
      try {
        const parsed = JSON.parse(bodyData.mediaUrls);
        if (Array.isArray(parsed)) mediaUrls.push(...parsed);
      } catch {
        mediaUrls.push(bodyData.mediaUrls);
      }
    } else if (Array.isArray(bodyData.mediaUrls)) {
      mediaUrls.push(...bodyData.mediaUrls);
    }
    bodyData.mediaUrls = mediaUrls;

    const data = citizenReportCreateSchema.parse(bodyData);

    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      return res.status(500).json({ success: false, message: 'System uninitialized' });
    }

    const report = await prisma.citizenReport.create({
      data: {
        userId: defaultUser.id,
        disasterType: data.disasterType,
        latitude: data.latitude,
        longitude: data.longitude,
        addressText: data.addressText,
        description: data.description,
        mediaUrls: JSON.stringify(data.mediaUrls)
      },
      include: { user: true }
    });

    ws.emit('report:new', report);

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports
reportsRouter.get('/', async (req, res, next) => {
  try {
    const reports = await prisma.citizenReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: true }
    });

    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/reports/:id/verify
reportsRouter.patch('/:id/verify', async (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = await prisma.citizenReport.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
