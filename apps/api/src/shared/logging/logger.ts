import pino from 'pino';
import { config } from '../../config/env.config';

export const logger = pino({
  name: 'Sajag:API',
  level: config.logLevel,
  transport:
    config.env !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard'
          }
        }
      : undefined
});
