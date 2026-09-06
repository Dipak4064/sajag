import admin from 'firebase-admin';
import { logger } from '../utils/logger';
import { sensorIngestionService } from '../services/ingestion.service';
import { TelemetryPayload } from '@sajag/types';

export class FirebaseLoRaListener {
  private isListening = false;

  constructor(
    private projectId?: string,
    private dbUrl?: string,
    private clientEmail?: string,
    private privateKey?: string
  ) {}

  public start() {
    if (!this.projectId || !this.dbUrl || !this.clientEmail || !this.privateKey) {
      logger.info('Firebase credentials not supplied. Firebase LoRa listener running in standby.');
      return;
    }

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

      const db = admin.database();
      const loraRef = db.ref('lora');

      loraRef.on('child_changed', async (snapshot) => {
        const data = snapshot.val();
        if (data && data.latest) {
          const payload: TelemetryPayload = data.latest;
          logger.info(`Received LoRa fallback packet from Firebase RTDB for ${payload.deviceId}`);
          await sensorIngestionService.ingestReading(payload, 'LORA_SIM');
        }
      });

      this.isListening = true;
      logger.info(`Firebase LoRa fallback listener active on ${this.dbUrl}`);
    } catch (err: any) {
      logger.warn(`Failed to start Firebase listener: ${err.message}`);
    }
  }
}
