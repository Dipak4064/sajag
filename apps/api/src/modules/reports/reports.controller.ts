import { Request, Response, NextFunction } from 'express';
import { citizenReportCreateSchema } from '#sajag-validation';
import { reportsRepository, ReportsRepository } from './reports.repository';
import { storageService } from '../files/storage.service';
import { WebSocketService } from '../../shared/websocket/socket.server';

export class ReportsController {
  private ws = WebSocketService.getInstance();

  constructor(private repo: ReportsRepository = reportsRepository) {}

  public createReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let mediaUrls: string[] = [];
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        const uploaded = await Promise.all(
          files.map((file) => storageService.uploadFile(file, 'reports'))
        );
        mediaUrls = uploaded.map((u) => u.url);
      }

      let bodyData = { ...req.body };
      if (typeof bodyData.latitude === 'string') bodyData.latitude = parseFloat(bodyData.latitude);
      if (typeof bodyData.longitude === 'string') bodyData.longitude = parseFloat(bodyData.longitude);
      if (typeof bodyData.mediaUrls === 'string') {
        try {
          const parsed = JSON.parse(bodyData.mediaUrls);
          if (Array.isArray(parsed)) mediaUrls.push(...parsed);
        } catch {
          mediaUrls.push(bodyData.mediaUrls);
        }
      } else if (Array.isArray(bodyData.mediaUrls)) {
        mediaUrls.push(...bodyData.mediaUrls);
      }
      bodyData.mediaUrls = mediaUrls;

      const data = citizenReportCreateSchema.parse(bodyData);

      const defaultUser = await this.repo.findDefaultUser();
      if (!defaultUser) {
        return res.status(500).json({ success: false, message: 'System uninitialized' });
      }

      const report = await this.repo.createReport({
        userId: defaultUser.id,
        disasterType: data.disasterType,
        latitude: data.latitude,
        longitude: data.longitude,
        addressText: data.addressText,
        description: data.description,
        mediaUrls: JSON.stringify(data.mediaUrls)
      });

      this.ws.emit('report:new', report);
      res.status(201).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  };

  public getAllReports = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const reports = await this.repo.findAllReports(50);
      res.json({ success: true, data: reports });
    } catch (err) {
      next(err);
    }
  };

  public verifyReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      const updated = await this.repo.updateReportStatus(req.params.id, status);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };
}

export const reportsController = new ReportsController();
