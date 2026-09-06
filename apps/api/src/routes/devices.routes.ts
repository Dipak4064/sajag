import { Router } from 'express';
import { prisma } from '../db/prisma';

export const devicesRouter = Router();

// GET /api/devices
devicesRouter.get('/', async (req, res, next) => {
  try {
    const devices = await prisma.device.findMany({
      include: {
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    res.json({ success: true, data: devices });
  } catch (err) {
    next(err);
  }
});

// GET /api/devices/:id
devicesRouter.get('/:id', async (req, res, next) => {
  try {
    const device = await prisma.device.findUnique({
      where: { id: req.params.id },
      include: {
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 20
        }
      }
    });

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    res.json({ success: true, data: device });
  } catch (err) {
    next(err);
  }
});

// GET /api/devices/:id/readings
devicesRouter.get('/:id/readings', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 50);
    const readings = await prisma.sensorReading.findMany({
      where: { deviceId: req.params.id },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    res.json({ success: true, data: readings });
  } catch (err) {
    next(err);
  }
});
