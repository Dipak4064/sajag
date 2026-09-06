import { Request, Response, NextFunction } from 'express';
import { simProxyService, SimProxyService } from './sim.service';
import { logger } from '../../shared/logging/logger';

export class SimController {
  constructor(private service: SimProxyService = simProxyService) {}

  public triggerScenario = async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const data = await this.service.triggerScenario(req.body);
      res.json(data);
    } catch (err: any) {
      logger.error(`Error forwarding scenario to simulator: ${err.message}`);
      if (err.response) {
        return res.status(err.response.status).json(err.response.data);
      }
      res.status(502).json({
        success: false,
        message: 'Failed to communicate with device-sim service. Is it running on port 4001?'
      });
    }
  };

  public setNetworkMode = async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const data = await this.service.setNetworkMode(req.body);
      res.json(data);
    } catch (err: any) {
      logger.error(`Error forwarding network mode to simulator: ${err.message}`);
      if (err.response) {
        return res.status(err.response.status).json(err.response.data);
      }
      res.status(502).json({
        success: false,
        message: 'Failed to communicate with device-sim service. Is it running on port 4001?'
      });
    }
  };

  public getDevices = async (_req: Request, res: Response, _next: NextFunction) => {
    try {
      const data = await this.service.getDevices();
      res.json(data);
    } catch (err: any) {
      if (err.response) {
        return res.status(err.response.status).json(err.response.data);
      }
      res.status(502).json({
        success: false,
        message: 'Failed to reach device-sim service.'
      });
    }
  };

  /**
   * Proxy a mobile phone's LoRa-mode telemetry packet to lora-sim:4002/transmit.
   * The phone can only reach port 4000 (ADB-forwarded), so the API relays this.
   */
  public loraTransmit = async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const data = await this.service.loraTransmit(req.body);
      res.json({ success: true, data });
    } catch (err: any) {
      logger.error(`LoRa transmit proxy error: ${err.message}`);
      res.status(502).json({
        success: false,
        message: 'Failed to forward to lora-sim. Is it running on port 4002?'
      });
    }
  };
}

export const simController = new SimController();

