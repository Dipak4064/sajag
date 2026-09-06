import { Request, Response, NextFunction } from 'express';
import { rescueRepository, RescueRepository } from './rescue.repository';
import { rescueService, RescueService } from './rescue.service';
import { parseCoordinates } from '../../shared/utils/request-parsers';

export class RescueController {
  constructor(
    private repo: RescueRepository = rescueRepository,
    private service: RescueService = rescueService
  ) {}

  public getTeams = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const teams = await this.repo.findAllTeams();
      res.json({ success: true, data: teams });
    } catch (err) {
      next(err);
    }
  };

  public getNearestTeams = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const coordinates = parseCoordinates(req);
      if (!coordinates) {
        return res.status(400).json({ success: false, message: 'Valid lat and lng query params required' });
      }

      const teams = await this.service.findNearestAvailableTeams(coordinates.lat, coordinates.lng, 5);
      res.json({ success: true, data: teams });
    } catch (err) {
      next(err);
    }
  };
}

export const rescueController = new RescueController();
