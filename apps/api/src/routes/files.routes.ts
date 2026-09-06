import { Router } from 'express';
import multer from 'multer';
import { storageService } from '../services/storage.service';
import { logger } from '../utils/logger';
import { Readable } from 'stream';

export const filesRouter = Router();

// Store files in memory so they can be piped directly to RustFS
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB max
  }
});

// POST /api/files/upload - Single file upload
filesRouter.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided in request' });
    }

    const folder = req.body.folder || 'general';
    const uploaded = await storageService.uploadFile(req.file, folder);

    res.status(201).json({
      success: true,
      data: uploaded
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/files/upload-multiple - Multiple files upload
filesRouter.post('/upload-multiple', upload.array('files', 10), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files provided' });
    }

    const folder = req.body.folder || 'general';
    const uploadedList = await Promise.all(
      files.map((file) => storageService.uploadFile(file, folder))
    );

    res.status(201).json({
      success: true,
      data: uploadedList
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/files/:folder/:filename - Stream file from RustFS
filesRouter.get('/:folder/:filename', async (req, res, next) => {
  try {
    const key = `${req.params.folder}/${req.params.filename}`;
    const fileObj = await storageService.getFileStream(key);

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
});

// GET /api/files/signed-url/:folder/:filename - Pre-signed temporary URL
filesRouter.get('/signed-url/:folder/:filename', async (req, res, next) => {
  try {
    const key = `${req.params.folder}/${req.params.filename}`;
    const url = await storageService.getPresignedDownloadUrl(key, 3600);
    res.json({ success: true, url });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/files/:folder/:filename - Delete file from RustFS
filesRouter.delete('/:folder/:filename', async (req, res, next) => {
  try {
    const key = `${req.params.folder}/${req.params.filename}`;
    await storageService.deleteFile(key);
    res.json({ success: true, message: `File ${key} deleted from RustFS` });
  } catch (err) {
    next(err);
  }
});
