import { Request, Response, NextFunction } from 'express';
import { devicesService, DevicesService } from './devices.service';

export class DevicesController {
  constructor(private service: DevicesService = devicesService) {}

  public getAllDevices = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const devices = await this.service.getAllDevices();
      res.json({ success: true, data: devices });
    } catch (err) {
      next(err);
    }
  };

  public getDeviceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const device = await this.service.getDeviceById(req.params.id);
      res.json({ success: true, data: device });
    } catch (err) {
      next(err);
    }
  };

  public getDeviceReadings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Number(req.query.limit || 50);
      const readings = await this.service.getDeviceReadings(req.params.id, limit);
      res.json({ success: true, data: readings });
    } catch (err) {
      next(err);
    }
  };
}

export const devicesController = new DevicesController();
