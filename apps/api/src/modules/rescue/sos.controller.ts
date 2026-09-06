import { Request, Response, NextFunction } from 'express';
import { sosCreateSchema, sosStatusUpdateSchema } from '#sajag-validation';
import { rescueRepository, RescueRepository } from './rescue.repository';
import { rescueService, RescueService } from './rescue.service';
import { WebSocketService } from '../../shared/websocket/socket.server';

export class SOSController {
  private ws = WebSocketService.getInstance();

  constructor(
    private repo: RescueRepository = rescueRepository,
    private service: RescueService = rescueService
  ) {}

  public getAllSOS = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const requests = await this.repo.findAllSOSRequests(50);
      res.json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  };

  public createSOS = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = sosCreateSchema.parse(req.body);

      let user = await this.repo.findUserByPhone(data.contactNumber);
      if (!user) {
        const defaultMuni = await this.repo.findDefaultMunicipality();
        user = await this.repo.createFallbackUser({
          name: 'Citizen (Emergency SOS)',
          phone: data.contactNumber,
          latitude: data.latitude,
          longitude: data.longitude,
          status: 'UNSAFE',
          municipalityId: defaultMuni!.id
        });
      }

      const sos = await this.repo.createSOSRequest({
        userId: user.id,
        latitude: data.latitude,
        longitude: data.longitude,
        addressText: data.addressText,
        description: data.description,
        numberOfPeople: data.numberOfPeople,
        medicalEmergency: data.medicalEmergency,
        contactNumber: data.contactNumber,
        status: 'PENDING'
      });

      this.ws.emit('sos:new', sos);
      res.status(201).json({ success: true, data: sos });
    } catch (err) {
      next(err);
    }
  };

  public getActiveSOS = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const requests = await this.repo.findActiveSOSRequests();
      const enriched = await Promise.all(
        requests.map(async (r: any) => {
          const nearbyTeams = await this.service.findNearestAvailableTeams(
            r.latitude,
            r.longitude,
            3
          );
          return { ...r, nearbyTeams };
        })
      );
      res.json({ success: true, data: enriched });
    } catch (err) {
      next(err);
    }
  };

  public updateSOSStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, assignedTeamId } = sosStatusUpdateSchema.parse(req.body);
      const updated = await this.repo.updateSOSStatus(req.params.id, {
        status,
        assignedTeamId,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined
      });

      this.ws.emit('sos:update', updated);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  public assignTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { teamId } = req.body;
      if (!teamId) {
        return res.status(400).json({ success: false, message: 'teamId is required' });
      }

      const updated = await this.service.assignTeamToSOS(req.params.id, teamId);
      this.ws.emit('sos:update', updated);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };
}

export const sosController = new SOSController();
