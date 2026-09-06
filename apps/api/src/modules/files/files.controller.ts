import { Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';
import { storageService, StorageService } from './storage.service';

export class FilesController {
  constructor(private service: StorageService = storageService) {}

  public uploadSingle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file provided in request' });
      }

      const folder = req.body.folder || 'general';
      const uploaded = await this.service.uploadFile(req.file, folder);

      res.status(201).json({
        success: true,
        data: uploaded
      });
    } catch (err) {
      next(err);
    }
  };

  public uploadMultiple = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files provided' });
      }

      const folder = req.body.folder || 'general';
      const uploadedList = await Promise.all(
        files.map((file) => this.service.uploadFile(file, folder))
      );

      res.status(201).json({
        success: true,
        data: uploadedList
      });
    } catch (err) {
      next(err);
    }
  };

  public getFileStream = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `${req.params.folder}/${req.params.filename}`;
      const fileObj = await this.service.getFileStream(key);

      if (fileObj.ContentType) {
        res.setHeader('Content-Type', fileObj.ContentType);
      }
      if (fileObj.ContentLength) {
        res.setHeader('Content-Length', fileObj.ContentLength.toString());
      }

      if (fileObj.Body instanceof Readable) {
        fileObj.Body.pipe(res);
      } else if (fileObj.Body && typeof (fileObj.Body as any).transformToByteArray === 'function') {
        const bytes = await (fileObj.Body as any).transformToByteArray();
        res.send(Buffer.from(bytes));
      } else {
        res.status(404).json({ success: false, message: 'File not readable' });
      }
    } catch (err: any) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return res.status(404).json({ success: false, message: 'File not found on RustFS' });
      }
      next(err);
    }
  };

  public getSignedUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `${req.params.folder}/${req.params.filename}`;
      const url = await this.service.getPresignedDownloadUrl(key, 3600);
      res.json({ success: true, url });
    } catch (err) {
      next(err);
    }
  };

  public deleteFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `${req.params.folder}/${req.params.filename}`;
      await this.service.deleteFile(key);
      res.json({ success: true, message: `File ${key} deleted from RustFS` });
    } catch (err) {
      next(err);
    }
  };
}

export const filesController = new FilesController();
