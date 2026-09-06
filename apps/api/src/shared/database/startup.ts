import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import '../../config/env.config';

export function connectionUrls(databaseUrl: string, directUrl?: string) {
  const runtime = new URL(databaseUrl);
  if (!['postgres:', 'postgresql:'].includes(runtime.protocol)) {
    throw new Error('Expected a PostgreSQL connection URL');
  }
  runtime.searchParams.set('connect_timeout', '30');
  if (!runtime.searchParams.has('connection_limit')) runtime.searchParams.set('connection_limit', '5');
  if (!runtime.searchParams.has('pool_timeout')) runtime.searchParams.set('pool_timeout', '30');
  const direct = new URL(directUrl || databaseUrl);
  if (!directUrl && direct.hostname.endsWith('.neon.tech')) {
    direct.hostname = direct.hostname.replace('-pooler.', '.');
  }
  direct.searchParams.set('connect_timeout', '30');
  return { databaseUrl: runtime.toString(), directUrl: direct.toString() };
}

function runPrisma(args: string[]) {
  return spawnSync(process.execPath, [
    require.resolve('prisma/build/index.js'),
    ...args,
    '--schema',
    'apps/api/prisma/schema.prisma'
  ], { env: process.env, encoding: 'utf8', timeout: 60000 });
}

function localMigrationNames() {
  try {
    return readdirSync('apps/api/prisma/migrations', { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

async function localSchemaNeedsPush(url: string) {
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    const tableRows = await client.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;
    const migrationRows = await client.$queryRaw<Array<{ exists: string | null }>>`
      SELECT to_regclass('public._prisma_migrations')::text AS exists
    `;
    return Number(tableRows[0]?.count || 0) > 0 && !migrationRows[0]?.exists;
  } finally {
    await client.$disconnect();
  }
}

export async function prepareDatabase() {
  const primary = process.env.DATABASE_URL?.trim();
  const fallback = process.env.LOCAL_DATABASE_URL?.trim()
    || 'postgresql://sajag:simulation@127.0.0.1:5432/sajag_simulation';
  const preferLocal = process.env.DB_PRIMARY === 'local' || process.env.USE_LOCAL_DB === 'true';
  const candidates = [
    ...(!preferLocal && primary ? [{ label: 'primary (Neon/configured)', url: primary,
      direct: process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL_UNPOOLED?.trim() }] : []),
    { label: 'local fallback', url: fallback, direct: fallback }
  ];

  for (const candidate of candidates) {
    let urls: ReturnType<typeof connectionUrls>;
    try {
      urls = connectionUrls(candidate.url, candidate.direct);
      // Probe with the same driver used by the application, including authentication.
      for (const url of new Set([urls.databaseUrl, urls.directUrl])) {
        const client = new PrismaClient({ datasources: { db: { url } } });
        try { await client.$queryRaw`SELECT 1`; }
        finally { await client.$disconnect(); }
      }
    } catch (error: any) {
      // Do not print connection strings or credentials.
      console.warn(`Database ${candidate.label} unavailable (${error.code || 'connection error'}).`);
      continue;
    }

    process.env.DATABASE_URL = urls.databaseUrl;
    process.env.DIRECT_URL = urls.directUrl;
    console.info(`Checking migrations for database: ${candidate.label}`);
    if (process.env.DB_MIGRATE_ON_START === 'true') {
      if (candidate.label === 'local fallback' && await localSchemaNeedsPush(urls.directUrl)) {
        console.info('Existing local database has schema but no migration history; synchronizing without accepting data loss.');
        const sync = runPrisma(['db', 'push', '--skip-generate']);
        if (sync.stdout) process.stdout.write(sync.stdout);
        if (sync.stderr) process.stderr.write(sync.stderr);
        if (sync.error || sync.status !== 0) {
          throw new Error('Local database schema synchronization failed. Check Prisma output above.');
        }
        for (const migration of localMigrationNames()) {
          const baseline = runPrisma(['migrate', 'resolve', '--applied', migration]);
          if (baseline.stdout) process.stdout.write(baseline.stdout);
          if (baseline.stderr) process.stderr.write(baseline.stderr);
          if (baseline.error || baseline.status !== 0) {
            throw new Error('Local database migration baseline failed. Check Prisma output above.');
          }
        }
        console.info(`Using database: ${candidate.label}`);
        return;
      }

      const result = runPrisma(['migrate', 'deploy']);
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
      if (result.error || result.status !== 0) {
        const output = `${result.stdout || ''}\n${result.stderr || ''}`;
        // Older local simulation volumes were initialized with db push and
        // have no migration history. Preserve their data and sync safely.
        if (candidate.label === 'local fallback' && /\bP3005\b/.test(output)) {
          console.info('Existing local database has no migration history; synchronizing without accepting data loss.');
          const sync = spawnSync(process.execPath, [
            require.resolve('prisma/build/index.js'), 'db', 'push',
            '--schema', 'apps/api/prisma/schema.prisma', '--skip-generate'
          ], { env: process.env, encoding: 'utf8', timeout: 60000 });
          if (sync.stdout) process.stdout.write(sync.stdout);
          if (sync.stderr) process.stderr.write(sync.stderr);
          if (sync.error || sync.status !== 0) {
            throw new Error('Local database schema synchronization failed. Check Prisma output above.');
          }
          console.info(`Using database: ${candidate.label}`);
          return;
        }
        // The connection can fail after a successful probe. Only connection
        // failures permit fallback; migration/schema failures still stop startup.
        if (/\bP100[01278]\b|\bP1017\b/.test(output)) {
          console.warn(`Database ${candidate.label} became unavailable during migration; trying the next database.`);
          continue;
        }
        throw new Error('Database migration failed. Check Prisma output above.');
      }
    }
    console.info(`Using database: ${candidate.label}`);
    return;
  }
  throw new Error('Neither the primary database nor local PostgreSQL is reachable. Check DATABASE_URL and LOCAL_DATABASE_URL.');
}
