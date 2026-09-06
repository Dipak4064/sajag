import { PrismaClient } from '@prisma/client';
import { config } from '../../config/env.config';

export const prisma = new PrismaClient({
  log: config.env === 'development' ? ['warn', 'error'] : ['error']
});
