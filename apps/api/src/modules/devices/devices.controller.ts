import { Request, Response, NextFunction } from 'express';
import { deviceTelemetryQuerySchema } from '#sajag-validation';
import { devicesService, DevicesService } from './devices.service';

export class DevicesController {
  constructor(private service: DevicesService = devicesService) {}

  public getAllDevices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const connectedOnly = req.query.connectedOnly === 'true';
      const devices = await this.service.getAllDevices(connectedOnly);
      res.json({ success: true, data: devices });
    } catch (err) {
      next(err);
    }
  };

  public getDeviceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requireConnected = req.query.requireConnected === 'true';
      const device = await this.service.getDeviceById(req.params.id, requireConnected);
      res.json({ success: true, data: device });
    } catch (err) {
      next(err);
    }
  };

  public getDeviceReadings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = deviceTelemetryQuerySchema.parse(req.query);
      const readings = await this.service.getDeviceReadings(req.params.id, query.limit, query.requireConnected);
      res.json({ success: true, data: readings });
    } catch (err) {
      next(err);
    }
  };

  public getConnectedTelemetry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = deviceTelemetryQuerySchema.parse(req.query);
      const device = await this.service.getConnectedTelemetry(req.params.id, query.limit);
      res.json({ success: true, data: device });
    } catch (err) {
      next(err);
    }
  };
}

export const devicesController = new DevicesController();
