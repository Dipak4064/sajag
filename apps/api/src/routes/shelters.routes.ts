import { Router } from 'express';
import { prisma } from '../db/prisma';
import { shelterService } from '../services/shelter.service';
import { parseCoordinates } from '../utils/request-parsers';

export const sheltersRouter = Router();

// GET /api/shelters
sheltersRouter.get('/', async (req, res, next) => {
  try {
    const shelters = await prisma.shelter.findMany({
      orderBy: { totalCapacity: 'desc' }
    });
    res.json({ success: true, data: shelters });
  } catch (err) {
    next(err);
  }
});

// GET /api/shelters/nearest
sheltersRouter.get('/nearest', async (req, res, next) => {
  try {
    const coordinates = parseCoordinates(req);
    if (!coordinates) {
      return res.status(400).json({ success: false, message: 'Valid lat and lng query params required' });
    }

    const shelters = await shelterService.findNearestShelters(coordinates.lat, coordinates.lng, 5);
    res.json({ success: true, data: shelters });
  } catch (err) {
    next(err);
  }
});
