import mqtt, { MqttClient } from 'mqtt';
import { logger } from '../../../shared/logging/logger';
import { sensorIngestionService, SensorIngestionService } from '../../../modules/telemetry/ingestion.service';
import { parseMqttTelemetry } from './mqtt.telemetry.parser';

export class MqttSubscriber {
  private client: MqttClient | null = null;

  constructor(
    private brokerUrl: string,
    private ingestionService: SensorIngestionService = sensorIngestionService,
    private options: mqtt.IClientOptions = {}
  ) {}

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

        this.client?.subscribe('prakop/device/+/telemetry', { qos: 1 });
        this.client?.subscribe('prakop/device/+/heartbeat', { qos: 0 });
        this.client?.subscribe('prakop/device/+/status', { qos: 0 });
        clearTimeout(timeout);
        safeResolve();
      });

      this.client.on('message', async (topic, message) => {
        try {
          if (topic.endsWith('/telemetry')) {
            // 1. Receive & parse data
            const payload = parseMqttTelemetry(topic, message);
            // 2. Invoke application use-case
            await this.ingestionService.ingestReading(payload, 'MQTT');
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
