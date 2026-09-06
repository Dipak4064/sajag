import { Router } from 'express';
import { prisma } from '../db/prisma';
import { WebSocketService } from '../websocket/socket.server';
import { citizenReportCreateSchema } from '@sajag/validation';

export const reportsRouter = Router();
const ws = WebSocketService.getInstance();

// POST /api/reports
reportsRouter.post('/', async (req, res, next) => {
  try {
    const data = citizenReportCreateSchema.parse(req.body);

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
