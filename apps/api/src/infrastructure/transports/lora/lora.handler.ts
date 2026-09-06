import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { parseLoRaEnvelope } from './lora.telemetry.parser';
import { sensorIngestionService, SensorIngestionService } from '../../../modules/telemetry/ingestion.service';
import { config } from '../../../config/env.config';

export class LoRaTransportHandler {
  constructor(private ingestionService: SensorIngestionService = sensorIngestionService) {}

  public handleIngress = async (req: Request, res: Response, next: NextFunction) => {
    if (!config.isSimulationMode) return res.sendStatus(404);
    if (!config.loraGatewayToken || req.headers['x-gateway-token'] !== config.loraGatewayToken) {
      return res.sendStatus(401);
    }

    try {
      // 1. Receive data envelope
      // 2. Parse & validate payload
      const payload = parseLoRaEnvelope(req.body);

      // 3. Invoke application use-case
      const result = await this.ingestionService.ingestReading(payload, 'LORA_SIM');

      // 4. Return result
      res.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof ZodError || error instanceof SyntaxError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid LoRa telemetry payload',
          errors: error instanceof ZodError ? error.errors : undefined
        });
      }
      next(error);
    }
  };
}

export const loraTransportHandler = new LoRaTransportHandler();
