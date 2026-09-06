import mqtt, { MqttClient } from 'mqtt';
import pino from 'pino';
import { TelemetryPayload } from '@sajag/types';

const logger = pino({ name: 'DeviceSim:MQTT' });

export class DeviceMqttClient {
  private client: MqttClient | null = null;
  private isConnected = false;

  constructor(private brokerUrl: string, private options: mqtt.IClientOptions = {}) {}

  public connect(): Promise<void> {
    return new Promise((resolve) => {
      let resolved = false;
      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      const timeout = setTimeout(() => {
        logger.warn(`MQTT connection timeout at ${this.brokerUrl}. Continuing in background...`);
        safeResolve();
      }, 3000);

      logger.info(`Connecting to MQTT broker at ${this.brokerUrl}...`);
      this.client = mqtt.connect(this.brokerUrl, {
        reconnectPeriod: 2000,
        connectTimeout: 5000,
        ...this.options
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Connected to MQTT Broker successfully.');
        clearTimeout(timeout);
        safeResolve();
      });

      this.client.on('error', (err) => {
        logger.warn(`MQTT connection error: ${err.message}. Retrying...`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('MQTT connection closed.');
      });
    });
  }

  public publishTelemetry(payload: TelemetryPayload): boolean {
    if (!this.client || !this.isConnected) {
      return false;
    }
    const topic = `prakop/device/${payload.deviceId}/telemetry`;
    this.client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (err) {
        logger.error(`Failed to publish telemetry to ${topic}: ${err.message}`);
      }
    });
    return true;
  }

  public publishHeartbeat(deviceId: string): boolean {
    if (!this.client || !this.isConnected) {
      return false;
    }
    const payload = JSON.stringify({ deviceId, timestamp: new Date().toISOString() });
    // Publish the SRS topic and retain the legacy alias for existing panels.
    this.client.publish(`prakop/device/${deviceId}/status`, payload, { qos: 0 });
    this.client.publish(`prakop/device/${deviceId}/heartbeat`, payload, { qos: 0 });
    return true;
  }

  public disconnect() {
    if (this.client) {
      this.client.end();
    }
  }
}
