const assert = require('node:assert/strict');
process.env.SIMULATION_MODE = 'true';
process.env.DATABASE_URL = 'postgresql://test:test@remote.example/db';
process.env.LOCAL_DATABASE_URL = 'postgresql://test:test@localhost/db';
let attempts = 0;
require.cache[require.resolve('../apps/api/dist/shared/database/startup')] = { exports: {prepareDatabase: async () => {
  attempts++;
  await new Promise(resolve => setImmediate(resolve));
  process.env.DATABASE_URL = process.env.LOCAL_DATABASE_URL;
  process.env.DIRECT_URL = process.env.LOCAL_DATABASE_URL;
}}};
require.cache[require.resolve('@prisma/client')] = { exports: {PrismaClient: class { async $disconnect() {} }} };
const db = require('../apps/api/dist/shared/database/prisma');
(async () => {
  const first = db.prisma;
  await db.recoverDatabase({code:'P2002'});
  assert.equal(attempts,0);
  await Promise.all([db.recoverDatabase({code:'P2024'}),db.recoverDatabase({code:'P2024'})]);
  assert.equal(attempts,1);
  assert.notEqual(db.prisma,first);
  assert.equal(new URL(process.env.DATABASE_URL).hostname,'localhost');
  await db.recoverDatabase({code:'P2024'});
  assert.equal(attempts,1);
  console.log('Passed: schema errors ignored, single-flight runtime fallback, local stays selected');
})().catch(e=>{console.error(e);process.exitCode=1;});
