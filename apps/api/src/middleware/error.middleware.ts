import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error({ stack: err.stack, path: req.path }, `API Error: ${err.message}`);

  const statusCode = err instanceof ZodError ? 400 : err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err instanceof ZodError ? 'Request validation failed' : err.message || 'Internal Server Error',
    errors: err instanceof ZodError ? err.errors : undefined,
    meta: {
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
}
