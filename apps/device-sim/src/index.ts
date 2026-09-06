import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pino from 'pino';
import { simulateScenarioSchema, simulateNetworkModeSchema } from '#sajag-validation';
import { KATHMANDU_VIRTUAL_DEVICES, VirtualDeviceConfig } from './devices';
import { TelemetryGenerator } from './generator';
import { DeviceMqttClient } from './mqtt.client';
import { DeviceLoRaClient } from './lora.client';
import { ScenarioManager } from './scenarios/scenario.manager';

dotenv.config();

const logger = pino({ name: 'DeviceSim:Main', transport: { target: 'pino-pretty' } });
const app = express();
app.use(cors());
app.use(express.json());

const port = Number(process.env.PORT || 4001);
const mqttUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';
const triggerIntervalMs = Math.max(5000, Number(process.env.TELEMETRY_TRIGGER_INTERVAL_MS || 15000));

// Device states - only the explicitly connected device will generate data
const deviceStates: Map<string, VirtualDeviceConfig> = new Map();
KATHMANDU_VIRTUAL_DEVICES.forEach((d) => deviceStates.set(d.deviceId, { ...d }));

const mqttClient = new DeviceMqttClient(mqttUrl);
const loraClient = new DeviceLoRaClient(process.env.LORA_SIM_URL || 'http://localhost:4002');
const generator = new TelemetryGenerator();
const scenarioManager = new ScenarioManager(generator);

async function publishDeviceReading(deviceId: string) {
  const device = deviceStates.get(deviceId);
  if (!device || !device.isActive) {
    throw new Error(`Unknown or inactive device: ${deviceId}`);
  }

  const payload = generator.generateReading(device);
  if (device.transport === 'LORA_SIM') {
    return loraClient.publishTelemetry(payload);
  }
  return mqttClient.publishTelemetry(payload);
}

// Control API
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'device-sim', deviceCount: deviceStates.size });
});

app.get('/devices', (req, res) => {
  res.json(Array.from(deviceStates.values()));
});

app.post('/devices/:deviceId/telemetry', async (req, res) => {
  try {
    const ok = await publishDeviceReading(req.params.deviceId);
    res.status(ok ? 202 : 503).json({ success: ok });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Trigger scripted disaster curve
app.post('/simulate/scenario', (req, res) => {
  const parseResult = simulateScenarioSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors });
  }

  const { scenario, targetDeviceId, durationSeconds } = parseResult.data;
  if (targetDeviceId && !deviceStates.has(targetDeviceId)) return res.status(404).json({ error: 'Unknown device' });
  scenarioManager.triggerScenario(
    scenario,
    targetDeviceId || 'ESP32-KTM-001',
    durationSeconds || 30,
    () => publishDeviceReading(targetDeviceId || 'ESP32-KTM-001'),
    triggerIntervalMs
  );

  res.json({
    success: true,
    message: `Triggered scenario ${scenario} on ${targetDeviceId || 'ESP32-KTM-001'} for ${durationSeconds}s`,
    intervalMs: triggerIntervalMs
  });
});

// Switch Network Mode: WiFi/MQTT (NORMAL) vs LoRa Fallback (LORA_FALLBACK)
app.post('/simulate/network-mode', (req, res) => {
  const parseResult = simulateNetworkModeSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors });
  }

  const { mode, deviceId } = parseResult.data;

  if (deviceId) {
    const dev = deviceStates.get(deviceId);
    if (!dev) return res.status(404).json({ error: 'Unknown device' });
    if (dev) {
      dev.transport = mode === 'LORA_FALLBACK' ? 'LORA_SIM' : 'MQTT';
      logger.info(`Switched device ${deviceId} transport to ${dev.transport}`);
    }
  } else {
    // Switch all
    deviceStates.forEach((dev) => {
      dev.transport = mode === 'LORA_FALLBACK' ? 'LORA_SIM' : 'MQTT';
    });
    logger.info(`Switched ALL devices transport to ${mode === 'LORA_FALLBACK' ? 'LORA_SIM' : 'MQTT'}`);
  }

  res.json({ success: true, mode, deviceId });
});

async function start() {
  await mqttClient.connect();

  app.listen(port, () => {
    logger.info(`Device Simulator HTTP Control API running on http://localhost:${port}`);
    logger.info(`Simulating ${deviceStates.size} Kathmandu Valley ESP32 Stations.`);
    logger.info(`Telemetry publishing disabled until triggered. Scenario interval: ${triggerIntervalMs}ms.`);
  });
}

start().catch((err) => {
  logger.error(`Fatal startup error in Device Simulator: ${err.message}`);
  process.exit(1);
});
