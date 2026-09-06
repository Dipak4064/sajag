import { logger } from '../../shared/logging/logger';
import { telemetryPayloadSchema } from '#sajag-validation';
import { IngestionGate } from '../../shared/database/ingestion-gate';
import { prisma, recoverDatabase, databaseTarget } from '../../shared/database/prisma';
import { WebSocketService } from '../../shared/websocket/socket.server';
import { riskEngine } from './risk.service';
import { alertStateMachine } from '../alerts/alert.service';
import { config } from '../../config/env.config';
import { TelemetryPayload, TransportType } from '#sajag-types';

export class SensorIngestionService {
  private gate = new IngestionGate();
  private municipalityLookup: Promise<{ id: string } | null> | undefined;
  private municipalityClient = prisma;
  private municipalityExpires = 0;
  private ws = WebSocketService.getInstance();
  private lastAlerts = new Map<string, number>();
  private alertDebounceMs = 30000;

  public async ingestReading(payload: TelemetryPayload, transport: TransportType) {
    return this.gate.run(async () => {
      try { return await this.persistReading(payload, transport); }
      catch (error) { await recoverDatabase(error); throw error; }
    });
  }

  private async persistReading(payload: TelemetryPayload, transport: TransportType) {
    const db = prisma;
    const { deviceId, sensors, timestamp, location, radiusMeters = 5000 } = telemetryPayloadSchema.parse(payload);

    if (this.municipalityClient !== db || Date.now() > this.municipalityExpires) {
      this.municipalityLookup = undefined;
      this.municipalityClient = db;
    }
    if (!this.municipalityLookup) {
      this.municipalityExpires = Date.now() + 60000;
      this.municipalityLookup = (async () => {
        const existing = await db.municipality.findFirst({ select: { id: true } });
        if (existing || !config.isSimulationMode) return existing;
        return db.municipality.upsert({
          where: { id: 'simulation-municipality' }, update: {},
          create: { id: 'simulation-municipality', name: 'Simulation Municipality' },
          select: { id: true }
        });
      })().catch(error => { this.municipalityLookup = undefined; throw error; });
    }
    const municipality = await this.municipalityLookup;
    if (!municipality) throw new Error('Configure a municipality before ingesting telemetry');

    const device = await db.device.upsert({
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

    const reading = await db.sensorReading.create({
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

    logger.info({ deviceId, readingId: reading.id, transport, database: databaseTarget() }, 'Telemetry stored');
    this.ws.emit('reading:new', reading);
    this.ws.emit('device:status', {
      deviceId,
      status: 'ONLINE',
      transport
    });

    const evaluation = riskEngine.evaluate(sensors);

    const now = Date.now();
    const key = `${deviceId}:${evaluation.primaryDisasterType}`;
    for (const [k, time] of this.lastAlerts) if (now - time > this.alertDebounceMs) this.lastAlerts.delete(k);
    let alertResult: any = { status: evaluation.isAlertTriggerRequired ? 'cooldown' : 'below_threshold' };
    if (evaluation.isAlertTriggerRequired && !this.lastAlerts.has(key)) {
      this.lastAlerts.set(key, now);
      try {
      const event = await alertStateMachine.triggerDisasterAlert({
        isSimulation: config.isSimulationMode,
        type: evaluation.primaryDisasterType,
        riskScore: evaluation.breakdown.overallScore,
        severity: evaluation.breakdown.severity,
        latitude: location.lat,
        longitude: location.lng,
        radiusMeters,
        title: `${evaluation.breakdown.severity} ${evaluation.primaryDisasterType} Warning`,
        description: `Dangerous sensor levels detected at ${device.name}: Water=${sensors.waterLevel}cm, Rain=${sensors.rainfall}mm/hr, Accel=${sensors.acceleration}g`
      });
      alertResult = { status: 'created', eventId: event.id, ...event.delivery };
      } catch (error: any) {
        this.lastAlerts.delete(key);
        logger.error({ deviceId, readingId: reading.id, code: error.code }, 'Reading stored but alert workflow failed');
        alertResult = { status: 'failed', message: 'Alert workflow failed; inspect backend logs.' };
      }
    }

    return { reading, evaluation, alert: alertResult, database: databaseTarget() };
  }
}

export const sensorIngestionService = new SensorIngestionService();
