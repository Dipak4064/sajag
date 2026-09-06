import { Router } from 'express';
import { prisma } from '../db/prisma';
import { WebSocketService } from '../websocket/socket.server';
import { rescueService } from '../services/rescue.service';
import { sosCreateSchema, sosStatusUpdateSchema } from '@sajag/validation';

export const sosRouter = Router();
const ws = WebSocketService.getInstance();

// POST /api/sos (Citizen triggers SOS)
sosRouter.post('/', async (req, res, next) => {
  try {
    const data = sosCreateSchema.parse(req.body);

    // Find or fallback user
    let user = await prisma.user.findFirst({
      where: { phone: data.contactNumber }
    });

    if (!user) {
      const defaultMuni = await prisma.municipality.findFirst();
      user = await prisma.user.create({
        data: {
          name: 'Citizen (Emergency SOS)',
          phone: data.contactNumber,
          latitude: data.latitude,
          longitude: data.longitude,
          status: 'UNSAFE',
          municipalityId: defaultMuni!.id
        }
      });
    }

    const sos = await prisma.sOSRequest.create({
      data: {
        userId: user.id,
        latitude: data.latitude,
        longitude: data.longitude,
        addressText: data.addressText,
        description: data.description,
        numberOfPeople: data.numberOfPeople,
        medicalEmergency: data.medicalEmergency,
        contactNumber: data.contactNumber,
        status: 'PENDING'
      },
      include: { user: true }
    });

    // Real-time broadcast to authority command center
    ws.emit('sos:new', sos);

    res.status(201).json({ success: true, data: sos });
  } catch (err) {
    next(err);
  }
});

// GET /api/sos/active (Authority Triage Queue)
sosRouter.get('/active', async (req, res, next) => {
  try {
    const requests = await prisma.sOSRequest.findMany({
      where: {
        status: { in: ['PENDING', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'] }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        assignedTeam: true
      }
    });

    // For each request, find nearest available teams
    const enriched = await Promise.all(
      requests.map(async (req) => {
        const nearbyTeams = await rescueService.findNearestAvailableTeams(
          req.latitude,
          req.longitude,
          3
        );
        return { ...req, nearbyTeams };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/sos/:id/status
sosRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, assignedTeamId } = sosStatusUpdateSchema.parse(req.body);

    const updated = await prisma.sOSRequest.update({
      where: { id: req.params.id },
      data: {
        status,
        assignedTeamId,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined
      },
      include: { assignedTeam: true, user: true }
    });

    ws.emit('sos:update', updated);

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/sos/:id/assign
sosRouter.post('/:id/assign', async (req, res, next) => {
  try {
    const { teamId } = req.body;
    if (!teamId) {
      return res.status(400).json({ success: false, message: 'teamId is required' });
    }

    const updated = await rescueService.assignTeamToSOS(req.params.id, teamId);
    ws.emit('sos:update', updated);

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
