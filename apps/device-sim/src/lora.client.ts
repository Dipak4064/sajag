import { TelemetryPayload } from '@sajag/types';
import pino from 'pino';

const logger = pino({ name: 'DeviceSim:LoRa' });

export class DeviceLoRaClient {
  constructor(private gatewayUrl: string) {}

  async publishTelemetry(payload: TelemetryPayload): Promise<boolean> {
    try {
      const response = await fetch(`${this.gatewayUrl}/transmit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ payload }),
        signal: AbortSignal.timeout(2000)
      });
      if (!response.ok) throw new Error(`Radio simulator returned ${response.status}`);
      return true; // Accepted by radio; delivery/loss is reported by gateway metrics.
    } catch (error) {
      logger.error({ error: String(error), deviceId: payload.deviceId }, 'LoRa transmission failed');
      return false;
    }
  }
}
