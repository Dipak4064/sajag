// Run inside the API container, or locally with npm dependencies installed.
const assert = require('node:assert/strict');
const mqtt = require('mqtt');
const api = process.env.TEST_API_URL || 'http://localhost:4000';
const radio = process.env.TEST_LORA_URL || 'http://localhost:4002';
const broker = process.env.MQTT_URL || 'mqtt://localhost:1883';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function devices() {
  const response = await fetch(`${api}/api/devices`);
  assert.equal(response.status, 200);
  return (await response.json()).data;
}
async function waitFor(check) {
  for (let i = 0; i < 60; i++) {
    const value = await check();
    if (value) return value;
    await pause(500);
  }
  throw new Error('Timed out waiting for telemetry ingestion');
}
(async () => {
  const client = await mqtt.connectAsync(broker, { connectTimeout: 5000, reconnectPeriod: 0 });
  try {
    const deviceId = `PANEL-TEST-${Date.now()}`;
    // Same timestamp-free JSON a static IoT MQTT Panel button publishes.
    const payload = { deviceId, location: { lat: 27.6895, lng: 85.3021 },
      sensors: { acceleration: 0.1, waterLevel: 22, soilMoisture: 30, rainfall: 2 } };
    await client.publishAsync(`prakop/device/${deviceId}/telemetry`, JSON.stringify(payload), { qos: 1 });
    const device = await waitFor(async () => (await devices()).find(d => d.deviceId === deviceId && d.readings.length));
    assert.equal(device.transport, 'MQTT');
    assert.equal(device.readings[0].waterLevel, 22);
    // Invalid input must never create a device.
    const badId = `${deviceId}-INVALID`;
    await client.publishAsync(`prakop/device/${badId}/telemetry`, JSON.stringify({ ...payload,
      deviceId: badId, sensors: { ...payload.sensors, soilMoisture: 101 } }), { qos: 1 });
    await pause(1000);
    assert.equal((await devices()).some(d => d.deviceId === badId), false);
    const response = await fetch(`${radio}/transmit`, { method: 'POST',
      headers: { 'content-type': 'application/json' }, body: JSON.stringify({ payload }) });
    assert.equal(response.status, 202);
    await waitFor(async () => (await devices()).find(d => d.deviceId === deviceId && d.transport === 'LORA_SIM'));
    const detail = await (await fetch(`${api}/api/devices/${device.id}`)).json();
    assert.ok(detail.data.readings.some(r => r.transport === 'MQTT'));
    assert.ok(detail.data.readings.some(r => r.transport === 'LORA_SIM'));
    console.log('PASS: live MQTT panel payload, validation rejection, and SimPy LoRa delivery');
  } finally { await client.endAsync(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
