import { prepareDatabase } from './shared/database/startup';
import { config } from './config/env.config';
import { logger } from './shared/logging/logger';

const port = config.port;

async function start() {
  try {
    await prepareDatabase();
    const { server } = await import('./app.js');
    const { MqttSubscriber } = await import('./infrastructure/mqtt/mqtt.subscriber.js');
    const mqttSubscriber = new MqttSubscriber(config.mqttUrl);
    // Start MQTT subscriber
    await mqttSubscriber.connect();

    // Start HTTP & Socket server
    server.listen(port, () => {
      logger.info(`🚨 SAJAG / Prakop Emergency Backend running on http://localhost:${port}`);
      logger.info(`WebSocket gateway active on ws://localhost:${port}`);
    });
  } catch (err: any) {
    logger.error(`Failed to start API server: ${err.message}`);
    process.exit(1);
  }
}

start();
