import mqtt, { MqttClient } from 'mqtt';
import { logger } from '../utils/logger';
import { sensorIngestionService } from '../services/ingestion.service';
import { parseMqttTelemetry } from './telemetry.parser';

export class MqttSubscriber {
  private client: MqttClient | null = null;

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
        logger.warn(`API MQTT Subscriber connection timeout (${this.brokerUrl}). Continuing in background...`);
        safeResolve();
      }, 3000);

      logger.info(`API MQTT Subscriber connecting to ${this.brokerUrl}...`);
      this.client = mqtt.connect(this.brokerUrl, {
        reconnectPeriod: 2500,
        connectTimeout: 5000,
        ...this.options
      });

      this.client.on('connect', () => {
        logger.info('API MQTT Subscriber connected to Mosquitto.');

        // Subscribe to all device telemetry and heartbeats
        this.client?.subscribe('prakop/device/+/telemetry', { qos: 1 });
        this.client?.subscribe('prakop/device/+/heartbeat', { qos: 0 });
        // `status` is the SRS name; `heartbeat` is retained for older panels.
        this.client?.subscribe('prakop/device/+/status', { qos: 0 });
        clearTimeout(timeout);
        safeResolve();
      });

      this.client.on('message', async (topic, message) => {
        try {
          if (topic.endsWith('/telemetry')) {
            const payload = parseMqttTelemetry(topic, message);
            await sensorIngestionService.ingestReading(payload, 'MQTT');
          }
        } catch (err: any) {
          logger.error(`Error processing MQTT message on ${topic}: ${err.message}`);
        }
      });

      this.client.on('error', (err) => {
        logger.warn(`MQTT Subscriber error: ${err.message}. Retrying...`);
      });
    });
  }

  public disconnect() {
    if (this.client) {
      this.client.end();
    }
  }
}
