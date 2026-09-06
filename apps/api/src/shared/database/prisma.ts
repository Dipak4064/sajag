import { PrismaClient } from '@prisma/client';
import { prepareDatabase } from './startup';
import { config } from '../../config/env.config';

export function databaseTarget() {
  const host = new URL(process.env.DATABASE_URL || 'postgresql://localhost').hostname;
  return host.endsWith('.neon.tech') ? 'neon' : 'local/configured';
}

export let prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  log: config.env === 'development' ? ['warn', 'error'] : ['error']
});

let recovery: Promise<void> | undefined;
export async function recoverDatabase(error: any) {
  const code = error.code || error.errorCode;
  if (!config.isSimulationMode || !['P1001', 'P1002', 'P1017', 'P2024'].includes(code)) return;
  if (recovery) return recovery;
  const local = process.env.LOCAL_DATABASE_URL;
  if (!local || new URL(process.env.DATABASE_URL!).host === new URL(local).host) return;
  recovery = (async () => {
    const previous = { url: process.env.DATABASE_URL, direct: process.env.DIRECT_URL };
    const oldClient = prisma;
    try {
      // Startup already tried Neon. A runtime connection failure now selects local.
      delete process.env.DATABASE_URL;
      await prepareDatabase();
      prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } }, log: ['error'] });
      console.warn('Runtime database connection failed; subsequent requests use local PostgreSQL. Failed readings are not replayed.');
      await oldClient.$disconnect();
    } catch (failure) {
      process.env.DATABASE_URL = previous.url;
      process.env.DIRECT_URL = previous.direct;
      throw failure;
    }
  })().finally(() => { recovery = undefined; });
  return recovery;
}
