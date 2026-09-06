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
   * Unified ingestion for both MQTT and Firebase RTDB transports
   */
  public async ingestReading(payload: TelemetryPayload, transport: TransportType) {
    const { deviceId, sensors, timestamp, location } = payload;

    // Security check: Find or register device
    let device = await prisma.device.findUnique({
      where: { deviceId }
    });

    if (!device) {
      // Find default municipality
      const defaultMuni = await prisma.municipality.findFirst();
      if (!defaultMuni) return;

      device = await prisma.device.create({
        data: {
          deviceId,
          name: `Sensor Station ${deviceId}`,
          latitude: location.lat,
          longitude: location.lng,
          status: 'ONLINE',
          transport,
          municipalityId: defaultMuni.id
        }
      });
    } else {
      // Update device heartbeat and active transport
      await prisma.device.update({
        where: { id: device.id },
        data: {
          status: 'ONLINE',
          transport,
          lastHeartbeat: new Date()
        }
      });
    }

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
