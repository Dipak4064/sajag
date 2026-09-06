import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env.config';
import { openApiDocument } from './openapi';
import { errorHandler } from './shared/errors/error.middleware';
import { WebSocketService } from './shared/websocket/socket.server';

// Domain Routers
import { authRouter } from './modules/auth/auth.routes';
import { devicesRouter } from './modules/devices/devices.routes';
import { alertsRouter } from './modules/alerts/alerts.routes';
import { sosRouter } from './modules/rescue/sos.routes';
import { rescueRouter } from './modules/rescue/rescue.routes';
import { sheltersRouter } from './modules/shelters/shelters.routes';
import { reportsRouter } from './modules/reports/reports.routes';
import { usersRouter } from './modules/users/users.routes';
import { transportsRouter } from './modules/telemetry/telemetry.routes';
import { simRouter } from './modules/sim/sim.routes';
import { filesRouter } from './modules/files/files.routes';
import { adsRouter } from './modules/ads/ads.routes';

const app = express();
const server = http.createServer(app);

const allowedOrigins = config.corsOrigins;

// Security & Body Parsing
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Real-time WebSocket Service Initialization
const wsService = WebSocketService.getInstance();
wsService.init(server, allowedOrigins);

// Health Check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'sajag-api'
  });
});

app.use('/phone-assets', express.static(path.join(__dirname, 'public')));
app.get('/phone-sw.js', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'phone-sw.js')));

// Mobile USB Phone Sensor Bridge GUI
app.get('/sensor', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mobile-sensor.html'));
});

// OpenAPI Documentation
app.get('/openapi.json', (_req, res) => res.json(openApiDocument));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { explorer: true }));

// Mount Modular Feature Routers
app.use('/api/auth', authRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/sos', sosRouter);
app.use('/api/rescue', rescueRouter);
app.use('/api/shelters', sheltersRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/users', usersRouter);
app.use('/api/transports', transportsRouter);
app.use('/api/sim', simRouter);
app.use('/api/files', filesRouter);
app.use('/api/ads', adsRouter);

// Global Error Handler
app.use(errorHandler);

export { app, server };
