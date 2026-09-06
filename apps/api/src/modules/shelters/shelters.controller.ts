import { Request, Response, NextFunction } from 'express';
import { sheltersRepository, SheltersRepository } from './shelters.repository';
import { shelterService, ShelterService } from './shelter.service';
import { parseCoordinates } from '../../shared/utils/request-parsers';

export class SheltersController {
  constructor(
    private repo: SheltersRepository = sheltersRepository,
    private service: ShelterService = shelterService
  ) {}

  public getAllShelters = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const shelters = await this.repo.findAllShelters();
      res.json({ success: true, data: shelters });
    } catch (err) {
      next(err);
    }
  };

  public getNearestShelters = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const coordinates = parseCoordinates(req);
      if (!coordinates) {
        return res.status(400).json({ success: false, message: 'Valid lat and lng query params required' });
      }

      const shelters = await this.service.findNearestShelters(coordinates.lat, coordinates.lng, 5);
      res.json({ success: true, data: shelters });
    } catch (err) {
      next(err);
    }
  };
}

export const sheltersController = new SheltersController();
