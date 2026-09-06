import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error({ stack: err.stack, path: req.path }, `API Error: ${err.message}`);

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    meta: {
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
}
