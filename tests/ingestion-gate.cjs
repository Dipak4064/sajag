const assert = require('node:assert/strict');
const { IngestionGate } = require('../apps/api/dist/shared/database/ingestion-gate');
(async () => {
  const gate = new IngestionGate();
  let release;
  const blocked = new Promise(resolve => { release = resolve; });
  const first = gate.run(() => blocked);
  const second = gate.run(() => blocked);
  await assert.rejects(gate.run(async () => 3), e => e.statusCode === 503);
  release();
  await Promise.all([first, second]);
  await assert.rejects(gate.run(async () => { throw Error('test failure'); }));
  assert.equal(await gate.run(async () => 4), 4);
  console.log('Passed: bounded concurrency, overload response, permit release on failure');
})().catch(e => { console.error(e); process.exitCode = 1; });
