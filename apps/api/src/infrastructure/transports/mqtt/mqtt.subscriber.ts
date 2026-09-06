import mqtt, { MqttClient } from 'mqtt';
import { logger } from '../../../shared/logging/logger';
import { sensorIngestionService, SensorIngestionService } from '../../../modules/telemetry/ingestion.service';
import { parseMqttTelemetry } from './mqtt.telemetry.parser';

export class MqttSubscriber {
  private pending = new Map<string, Buffer>();
  private draining = false;

  private async drain() {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.pending.size) {
        const [topic, message] = this.pending.entries().next().value!;
        this.pending.delete(topic);
        try {
          await this.ingestionService.ingestReading(parseMqttTelemetry(topic, message), 'MQTT');
        } catch (err: any) {
          logger.warn({ code: err.code || err.statusCode }, 'MQTT reading not stored; waiting for the next reading.');
        }
      }
    } finally { this.draining = false; }
  }

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

      this.client.on('message', (topic, message) => {
        if (!topic.endsWith('/telemetry')) return;
        // Under load retain the latest reading per node, not an unbounded backlog.
        if (!this.pending.has(topic) && this.pending.size >= 128) {
          logger.warn('MQTT telemetry backlog full; reading dropped.');
          return;
        }
        this.pending.set(topic, message);
        void this.drain();
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
