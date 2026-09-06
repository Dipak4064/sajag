import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  env: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigins: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4000', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:4000'],
  jwtSecret: process.env.JWT_SECRET || 'sajag_jwt_secret_dev_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mqttUrl: process.env.MQTT_URL || 'mqtt://localhost:1883',
  simulatorUrl: process.env.SIMULATOR_URL || 'http://localhost:4001',
  loraSimUrl: process.env.LORA_SIM_URL || 'http://localhost:4002',
  isSimulationMode: process.env.SIMULATION_MODE === 'true',
  loraGatewayToken: process.env.LORA_GATEWAY_TOKEN || 'local-simulation-gateway',
  databaseUrl: process.env.DATABASE_URL
};

export type AppConfig = typeof config;
