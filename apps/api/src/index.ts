import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { WebSocketService } from './websocket/socket.server';
import { MqttSubscriber } from './transports/mqtt.subscriber';
import { FirebaseLoRaListener } from './transports/firebase.listener';
import { errorHandler } from './middleware/error.middleware';

// Routes
import { authRouter } from './routes/auth.routes';
import { devicesRouter } from './routes/devices.routes';
import { alertsRouter } from './routes/alerts.routes';
import { sosRouter } from './routes/sos.routes';
import { rescueRouter } from './routes/rescue.routes';
import { sheltersRouter } from './routes/shelters.routes';
import { reportsRouter } from './routes/reports.routes';
import { usersRouter } from './routes/users.routes';
import { simRouter } from './routes/sim.routes';

dotenv.config();

const app = express();
const server = http.createServer(app);

const port = Number(process.env.PORT || 4000);
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Security & Parsing
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Real-time WebSocket
const wsService = WebSocketService.getInstance();
wsService.init(server, corsOrigin);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'sajag-api'
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/sos', sosRouter);
app.use('/api/rescue', rescueRouter);
app.use('/api/shelters', sheltersRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/users', usersRouter);
app.use('/api/sim', simRouter);

// Global Error Handler
app.use(errorHandler);

// Start Background Ingestion Transports
const mqttUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';
const mqttSubscriber = new MqttSubscriber(mqttUrl);

const firebaseListener = new FirebaseLoRaListener(
  process.env.FIREBASE_PROJECT_ID,
  process.env.FIREBASE_DB_URL,
  process.env.FIREBASE_CLIENT_EMAIL,
  process.env.FIREBASE_PRIVATE_KEY
);

async function start() {
  try {
    // Start MQTT subscriber
    await mqttSubscriber.connect();

    // Start Firebase listener (standby or live)
    firebaseListener.start();

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
