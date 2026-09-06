import { telemetryPayloadSchema } from '@sajag/validation';
import { prisma } from '../db/prisma';
import { WebSocketService } from '../websocket/socket.server';
import { riskEngine } from './risk.service';
import { alertStateMachine } from './alert.service';
import { logger } from '../utils/logger';
import { TelemetryPayload, TransportType } from '@sajag/types';

export class SensorIngestionService {
  private ws = WebSocketService.getInstance();
  private lastAlertTriggeredAt: number = 0;
  private alertDebounceMs = 30000; // 30s debounce to prevent duplicate alerts

  /**
   * Unified ingestion for MQTT and simulated LoRa gateway transports
   */
  public async ingestReading(payload: TelemetryPayload, transport: TransportType) {
    const { deviceId, sensors, timestamp, location } = telemetryPayloadSchema.parse(payload);

    let municipality = await prisma.municipality.findFirst();
    if (!municipality && process.env.SIMULATION_MODE === 'true') {
      // Configuration created on first traffic; no seeded devices or readings.
      municipality = await prisma.municipality.upsert({
        where: { id: 'simulation-municipality' },
        update: {},
        create: { id: 'simulation-municipality', name: 'Simulation Municipality' }
      });
    }
    if (!municipality) throw new Error('Configure a municipality before ingesting telemetry');

    const device = await prisma.device.upsert({
      where: { deviceId },
      create: {
        deviceId, name: `Sensor Station ${deviceId}`,
        latitude: location.lat, longitude: location.lng,
        status: 'ONLINE', transport, lastHeartbeat: new Date(),
        municipalityId: municipality.id
      },
      update: {
        status: 'ONLINE', transport, lastHeartbeat: new Date(),
        latitude: location.lat, longitude: location.lng
      }
    });

    // 1. Save SensorReading
    const reading = await prisma.sensorReading.create({
      data: {
        deviceId: device.id,
        acceleration: sensors.acceleration,
        waterLevel: sensors.waterLevel,
        soilMoisture: sensors.soilMoisture,
        rainfall: sensors.rainfall,
        transport,
        timestamp: timestamp ? new Date(timestamp) : new Date()
      }
    });

    // 2. Broadcast live reading to municipal dashboard
    this.ws.emit('reading:new', reading);
    this.ws.emit('device:status', {
      deviceId,
      status: 'ONLINE',
      transport
    });

    // 3. Evaluate Risk through deterministic RiskEngine
    const evaluation = riskEngine.evaluate(sensors);

    // 4. Trigger alert pipeline if hazard crosses HIGH or CRITICAL threshold
    const now = Date.now();
    if (evaluation.isAlertTriggerRequired && now - this.lastAlertTriggeredAt > this.alertDebounceMs) {
      this.lastAlertTriggeredAt = now;
      await alertStateMachine.triggerDisasterAlert({
        isSimulation: process.env.SIMULATION_MODE === 'true',
        type: evaluation.primaryDisasterType,
        riskScore: evaluation.breakdown.overallScore,
        severity: evaluation.breakdown.severity,
        latitude: location.lat,
        longitude: location.lng,
        radiusMeters: 5000,
        title: `${evaluation.breakdown.severity} ${evaluation.primaryDisasterType} Warning`,
        description: `Dangerous sensor levels detected at ${device.name}: Water=${sensors.waterLevel}cm, Rain=${sensors.rainfall}mm/hr, Accel=${sensors.acceleration}g`
      });
    }

    return { reading, evaluation };
  }
}

export const sensorIngestionService = new SensorIngestionService();
