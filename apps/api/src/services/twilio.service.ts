import twilio from 'twilio';
import { logger } from '../utils/logger';

export class TwilioCallService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string = '';
  private isConfigured: boolean = false;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '+15005550006';

    if (accountSid && authToken && accountSid.startsWith('AC')) {
      try {
        this.client = twilio(accountSid, authToken);
        this.isConfigured = true;
        logger.info('Twilio IVR Voice Service initialized successfully.');
      } catch (err: any) {
        logger.warn(`Failed to initialize Twilio client: ${err.message}. Operating in mock IVR mode.`);
      }
    } else {
      logger.info('Twilio credentials not provided. Operating in mock IVR voice mode.');
    }
  }

  /**
   * Places an outbound automated IVR emergency call
   */
  public async placeEmergencyCall(alertId: string, recipientPhone: string, userName: string): Promise<string> {
    const callbackUrl = `${process.env.PUBLIC_API_URL || 'http://localhost:4000'}/api/alerts/${alertId}/twiml`;

    if (this.isConfigured && this.client) {
      try {
        const call = await this.client.calls.create({
          to: recipientPhone,
          from: this.fromNumber,
          url: callbackUrl
        });
        logger.info(`Twilio call initiated to ${recipientPhone} (Call SID: ${call.sid})`);
        return call.sid;
      } catch (err: any) {
        logger.error(`Error placing Twilio call to ${recipientPhone}: ${err.message}`);
        return `mock-call-${Date.now()}`;
      }
    }

    // Mock Mode: Log simulated call for demo
    logger.info(`[MOCK-TWILIO-IVR] Calling ${recipientPhone} (${userName}) for Alert ${alertId}...`);
    return `mock-call-${Date.now()}`;
  }

  /**
   * Generates exact TwiML for the IVR Gather loop
   */
  public generateGatherTwiml(alertId: string): string {
    const responseActionUrl = `/api/alerts/${alertId}/response`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">Emergency alert from Prakop. Are you safe? Press 1 for safe. Press 2 if you need assistance.</Say>
  <Gather numDigits="1" action="${responseActionUrl}" method="POST" timeout="10">
    <Say voice="Polly.Aditi">Please press 1 for safe, or press 2 for assistance.</Say>
  </Gather>
  <Say voice="Polly.Aditi">No input received. We will retry reaching you shortly.</Say>
  <Hangup/>
</Response>`;
  }

  /**
   * Generates TwiML for recording voice message when citizen presses 2 (UNSAFE)
   */
  public generateRecordTwiml(alertId: string): string {
    const recordActionUrl = `/api/alerts/${alertId}/voice-upload`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">Please describe your situation and immediate needs after the beep. You have 5 seconds.</Say>
  <Record maxLength="5" action="${recordActionUrl}" method="POST" playBeep="true" />
  <Say voice="Polly.Aditi">Thank you. Your emergency rescue request has been logged. Help is on the way.</Say>
  <Hangup/>
</Response>`;
  }
}

export const twilioService = new TwilioCallService();
