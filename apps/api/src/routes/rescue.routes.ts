import { Router } from 'express';
import { prisma } from '../db/prisma';
import { rescueService } from '../services/rescue.service';

export const rescueRouter = Router();

// GET /api/rescue/teams
rescueRouter.get('/teams', async (req, res, next) => {
  try {
    const teams = await prisma.rescueTeam.findMany({
      orderBy: { name: 'asc' },
      include: {
        assignments: {
          where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } }
        }
      }
    });

    res.json({ success: true, data: teams });
  } catch (err) {
    next(err);
  }
});

// GET /api/rescue/nearest
rescueRouter.get('/nearest', async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'Valid lat and lng query params required' });
    }

    const teams = await rescueService.findNearestAvailableTeams(lat, lng, 5);
    res.json({ success: true, data: teams });
  } catch (err) {
    next(err);
  }
});
