import { Request, Response, NextFunction } from 'express';
import { loraTransportHandler } from '../../infrastructure/transports/lora/lora.handler';
import { config } from '../../config/env.config';

export class TelemetryController {
  public getStatus = (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        mqtt: { topic: 'prakop/device/+/telemetry', status: 'prakop/device/+/status', heartbeatLegacy: 'prakop/device/+/heartbeat', qos: 1 },
        lora: { mode: 'SIMPY_GATEWAY', ingress: '/api/transports/lora', transport: 'LORA_SIM' },
        simulation: config.isSimulationMode
      }
    });
  };

  public handleLoRaIngress = (req: Request, res: Response, next: NextFunction) => {
    return loraTransportHandler.handleIngress(req, res, next);
  };
}

export const telemetryController = new TelemetryController();
