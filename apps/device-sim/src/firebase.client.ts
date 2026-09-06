import admin from 'firebase-admin';
import pino from 'pino';
import { TelemetryPayload } from '@sajag/types';

const logger = pino({ name: 'DeviceSim:FirebaseLoRa' });

export class DeviceFirebaseClient {
  private isInitialized = false;
  private db: admin.database.Database | null = null;

  constructor(
    private projectId?: string,
    private dbUrl?: string,
    private clientEmail?: string,
    private privateKey?: string
  ) {
    this.init();
  }

  private init() {
    if (this.projectId && this.dbUrl && this.clientEmail && this.privateKey) {
      try {
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: this.projectId,
              clientEmail: this.clientEmail,
              privateKey: this.privateKey.replace(/\\n/g, '\n')
            }),
            databaseURL: this.dbUrl
          });
        }
        this.db = admin.database();
        this.isInitialized = true;
        logger.info(`Firebase Realtime Database initialized for LoRa simulation (${this.dbUrl})`);
      } catch (err: any) {
        logger.warn(`Firebase initialization skipped: ${err.message}. Operating in mock LoRa mode.`);
      }
    } else {
      logger.info('Firebase credentials not set. Simulated LoRa fallback will run in memory mock mode.');
    }
  }

  public async publishLoRaPayload(payload: TelemetryPayload): Promise<boolean> {
    const loraRecord = {
      ...payload,
      gatewayId: 'GATEWAY-KTM-01',
      hopTimestamp: Date.now(),
      transport: 'LORA_SIM'
    };

    if (this.isInitialized && this.db) {
      try {
        await this.db.ref(`lora/${payload.deviceId}/latest`).set(loraRecord);
        await this.db.ref('lora/gatewayStatus/GATEWAY-KTM-01').set({
          online: true,
          lastSeen: Date.now()
        });
        return true;
      } catch (err: any) {
        logger.error(`Error writing LoRa simulation to Firebase RTDB: ${err.message}`);
        return false;
      }
    }

    // Mock LoRa mode - log to console so demo operator can see it working
    logger.info(`[LORA-SIMULATED-FALLBACK] Device ${payload.deviceId} -> GATEWAY-KTM-01 -> RTDB: water=${payload.sensors.waterLevel}, rain=${payload.sensors.rainfall}`);
    return true;
  }
}
