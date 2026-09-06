import { Router } from 'express';
import { ZodError } from 'zod';
import { sensorIngestionService } from '../services/ingestion.service';
import { parseLoRaEnvelope } from '../transports/telemetry.parser';

export const transportsRouter = Router();

transportsRouter.get('/status', (_req, res) => {
  res.json({
    success: true,
    data: {
      mqtt: { topic: 'prakop/device/+/telemetry', status: 'prakop/device/+/status', heartbeatLegacy: 'prakop/device/+/heartbeat', qos: 1 },
      lora: { mode: 'SIMPY_GATEWAY', ingress: '/api/transports/lora', transport: 'LORA_SIM' },
      simulation: process.env.SIMULATION_MODE === 'true'
    }
  });
});

transportsRouter.post('/lora', async (req, res, next) => {
  if (process.env.SIMULATION_MODE !== 'true') return res.sendStatus(404);
  if (!process.env.LORA_GATEWAY_TOKEN || req.headers['x-gateway-token'] !== process.env.LORA_GATEWAY_TOKEN) {
    return res.sendStatus(401);
  }

  try {
    const result = await sensorIngestionService.ingestReading(parseLoRaEnvelope(req.body), 'LORA_SIM');
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return res.status(400).json({ success: false, message: 'Invalid LoRa telemetry payload', errors: error instanceof ZodError ? error.errors : undefined });
    }
    next(error);
  }
});
