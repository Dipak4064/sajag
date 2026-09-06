import twilio from 'twilio';
import { logger } from '../../shared/logging/logger';

export class TwilioCallService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string = '';
  private isConfigured: boolean = false;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber  = process.env.TWILIO_PHONE_NUMBER || '+15005550006';

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
   * Build inline TwiML for an emergency call.
   * Uses the `twiml` parameter (not `url`) so no public webhook endpoint is needed —
   * works on Twilio free trial accounts without ngrok.
   */
  private buildEmergencyTwiml(userName: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">
    Emergency alert from Prakop disaster monitoring system.
    ${userName}, your area has detected dangerous seismic or flood sensor readings.
    Are you safe? Press 1 if you are safe. Press 2 if you need immediate assistance.
  </Say>
  <Gather numDigits="1" timeout="10">
    <Say voice="Polly.Aditi" language="en-IN">Press 1 for safe, or 2 for assistance now.</Say>
  </Gather>
  <Say voice="Polly.Aditi" language="en-IN">No input received. Emergency services have been notified. Please stay safe.</Say>
  <Hangup/>
</Response>`;
  }

  public async placeEmergencyCall(
    alertId: string,
    recipientPhone: string,
    userName: string
  ): Promise<string> {
    if (this.isConfigured && this.client) {
      try {
        const call = await this.client.calls.create({
          to:    recipientPhone,
          from:  this.fromNumber,
          // Inline TwiML — no public callback URL needed; works on trial accounts
          twiml: this.buildEmergencyTwiml(userName)
        });
        logger.info(`Twilio call initiated to ${recipientPhone} for alert ${alertId} (SID: ${call.sid})`);
        return call.sid;
      } catch (err: any) {
        // Trial accounts can only call verified numbers — log but do not crash the alert flow
        logger.error(`Twilio call to ${recipientPhone} failed: ${err.message}`);
        return `mock-call-failed-${Date.now()}`;
      }
    }

    logger.info(`[MOCK-TWILIO-IVR] Would call ${recipientPhone} (${userName}) for alert ${alertId}`);
    return `mock-call-${Date.now()}`;
  }

  /** TwiML for the /api/alerts/:id/twiml route (kept for prod/ngrok setup) */
  public generateGatherTwiml(alertId: string): string {
    const responseActionUrl = `/api/alerts/${alertId}/response`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">Emergency alert from Prakop. Are you safe? Press 1 for safe. Press 2 if you need assistance.</Say>
  <Gather numDigits="1" action="${responseActionUrl}" method="POST" timeout="10">
    <Say voice="Polly.Aditi" language="en-IN">Please press 1 for safe, or press 2 for assistance.</Say>
  </Gather>
  <Say voice="Polly.Aditi" language="en-IN">No input received. We will retry reaching you shortly.</Say>
  <Hangup/>
</Response>`;
  }

  public generateRecordTwiml(alertId: string): string {
    const recordActionUrl = `/api/alerts/${alertId}/voice-upload`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">Please describe your situation and immediate needs after the beep. You have 5 seconds.</Say>
  <Record maxLength="5" action="${recordActionUrl}" method="POST" playBeep="true" />
  <Say voice="Polly.Aditi" language="en-IN">Thank you. Your emergency rescue request has been logged. Help is on the way.</Say>
  <Hangup/>
</Response>`;
  }
}

export const twilioService = new TwilioCallService();

