import { Router } from 'express';
import multer from 'multer';
import { filesController } from './files.controller';

export const filesRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

filesRouter.post('/upload', upload.single('file'), filesController.uploadSingle);
filesRouter.post('/upload-multiple', upload.array('files', 10), filesController.uploadMultiple);
filesRouter.get('/:folder/:filename', filesController.getFileStream);
filesRouter.get('/signed-url/:folder/:filename', filesController.getSignedUrl);
filesRouter.delete('/:folder/:filename', filesController.deleteFile);
