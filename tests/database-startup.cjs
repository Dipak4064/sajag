const { test } = require('node:test');
const assert = require('node:assert/strict');
require('dotenv').config();
const calls = [];
const migrations = [];
const migrationCommands = [];
let migrationResults = [];
let migrationTableExists = true;
require('node:child_process').spawnSync = (_command, _args, options) => {
  migrations.push({ ...options.env });
  migrationCommands.push(_args);
  return migrationResults.shift() || { status: 0, stdout: '', stderr: '' };
};
let unavailable = new Set();
require.cache[require.resolve('@prisma/client')] = { exports: { PrismaClient: class {
  constructor(options) { this.url = options.datasources.db.url; }
  async $queryRaw(strings) {
    const host = new URL(this.url).hostname;
    calls.push(host);
    if (unavailable.has(host)) throw Object.assign(new Error('offline'), { code: 'P1001' });
    const sql = Array.isArray(strings) ? strings.join('') : '';
    if (sql.includes('information_schema.tables')) return [{ count: 1n }];
    if (sql.includes('to_regclass')) return [{ exists: migrationTableExists ? '_prisma_migrations' : null }];
    return [{ '?column?': 1 }];
  }
  async $disconnect() {}
} } };
const { prepareDatabase, connectionUrls } = require('../apps/api/dist/shared/database/startup');
const primary = 'postgresql://user:secret@ep-test-pooler.region.neon.tech/db';
const local = 'postgresql://sajag:simulation@localhost:5432/sajag_simulation';
test('database startup selection', async () => {
  process.env.DB_MIGRATE_ON_START = 'false';
  process.env.LOCAL_DATABASE_URL = local;
  delete process.env.DIRECT_URL;
  delete process.env.DATABASE_URL_UNPOOLED;
  process.env.DATABASE_URL = primary;
  await prepareDatabase();
  assert.deepEqual(calls, ['ep-test-pooler.region.neon.tech', 'ep-test.region.neon.tech']);
  assert.equal(new URL(process.env.DATABASE_URL).hostname, 'ep-test-pooler.region.neon.tech');
  calls.length = 0;
  process.env.DATABASE_URL = primary;
  delete process.env.DIRECT_URL;
  unavailable = new Set(['ep-test-pooler.region.neon.tech']);
  await prepareDatabase();
  assert.deepEqual(calls, ['ep-test-pooler.region.neon.tech', 'localhost', 'localhost']);
  assert.equal(new URL(process.env.DATABASE_URL).host, new URL(process.env.DIRECT_URL).host);
  process.env.DATABASE_URL = primary;
  delete process.env.DIRECT_URL;
  unavailable.add('localhost');
  await assert.rejects(prepareDatabase(), /Neither the primary/);
  unavailable.clear();
  delete process.env.DATABASE_URL;
  await prepareDatabase();
  assert.equal(new URL(process.env.DATABASE_URL).hostname, 'localhost');
  assert.equal(new URL(connectionUrls(primary).directUrl).hostname, 'ep-test.region.neon.tech');
});

test('migration connection failure switches both URLs to local; schema errors fail closed', async () => {
  unavailable.clear();
  process.env.DB_MIGRATE_ON_START = 'true';
  process.env.LOCAL_DATABASE_URL = local;
  process.env.DATABASE_URL = primary;
  delete process.env.DIRECT_URL;
  migrationResults = [{ status: 1, stderr: 'Error: P1001 Cannot reach database server' }];
  await prepareDatabase();
  assert.equal(migrations.length, 2);
  assert.equal(new URL(migrations[0].DATABASE_URL).hostname, 'ep-test-pooler.region.neon.tech');
  assert.equal(new URL(migrations[1].DATABASE_URL).hostname, 'localhost');
  assert.equal(new URL(migrations[1].DATABASE_URL).host, new URL(migrations[1].DIRECT_URL).host);
  assert.equal(process.env.DATABASE_URL, migrations[1].DATABASE_URL);
  migrations.length = 0;
  process.env.DATABASE_URL = primary;
  delete process.env.DIRECT_URL;
  migrationResults = [{ status: 1, stderr: 'Error: P3009 failed migration' }];
  await assert.rejects(prepareDatabase(), /Database migration failed/);
  assert.equal(migrations.length, 1);
});

test('legacy local database is synchronized without accepting data loss', async () => {
  unavailable.clear();
  delete process.env.DATABASE_URL;
  process.env.LOCAL_DATABASE_URL = local;
  process.env.DB_MIGRATE_ON_START = 'true';
  migrations.length = 0;
  migrationCommands.length = 0;
  migrationTableExists = false;
  migrationResults = [{ status: 0, stdout: '' }, { status: 0, stdout: '' }];
  await prepareDatabase();
  assert.equal(migrations.length, 2);
  assert.equal(new URL(process.env.DATABASE_URL).hostname, 'localhost');
  assert.ok(migrationCommands[0].includes('--skip-generate'));
  assert.ok(!migrationCommands[0].includes('--accept-data-loss'));
  assert.ok(migrationCommands[1].includes('resolve'));
  assert.ok(migrationCommands[1].includes('--applied'));
  migrationTableExists = true;
});
