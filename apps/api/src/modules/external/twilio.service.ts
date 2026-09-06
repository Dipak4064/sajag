import twilio from 'twilio';
import { logger } from '../../shared/logging/logger';

export class TwilioCallService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string = '';
  private isConfigured: boolean = false;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber  = process.env.TWILIO_PHONE_NUMBER || '';

    if (accountSid && authToken && accountSid.startsWith('AC') && this.fromNumber) {
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

  public readiness() {
    return {
      configured: this.isConfigured,
      responseWebhookConfigured: Boolean(process.env.TWILIO_PUBLIC_BASE_URL || process.env.PUBLIC_API_URL)
    };
  }

  /**
   * Build inline TwiML for an emergency call.
   * Uses the `twiml` parameter (not `url`) so no public webhook endpoint is needed —
   * works on Twilio free trial accounts without ngrok.
   */
  private buildEmergencyTwiml(userName: string, alertId: string): string {
    const response = new twilio.twiml.VoiceResponse();
    response.say({ voice: 'alice' }, `Emergency alert from Prakop. ${userName}, dangerous sensor readings were detected near your registered location.`);
    const base = process.env.TWILIO_PUBLIC_BASE_URL || process.env.PUBLIC_API_URL;
    if (base) {
      response.gather({ numDigits: 1, action: `${base.replace(/\/$/, '')}/api/alerts/${encodeURIComponent(alertId)}/response`, method: 'POST', timeout: 10 })
        .say('Press 1 if you are safe. Press 2 if you need assistance.');
    } else {
      response.gather({ numDigits: 1, action: `/api/alerts/${encodeURIComponent(alertId)}/response`, method: 'POST', timeout: 10 })
        .say('Press 1 if you are safe. Press 2 if you need assistance.');
    }
    response.hangup();
    return response.toString();
  }

  public async placeEmergencyCall(
    alertId: string,
    recipientPhone: string,
    userName: string
  ): Promise<{ status: 'queued' | 'failed' | 'not_configured'; sid?: string; code?: number }> {
    if (this.isConfigured && this.client) {
      try {
        const call = await this.client.calls.create({
          to:    recipientPhone,
          from:  this.fromNumber,
          // Inline TwiML — no public callback URL needed; works on trial accounts
          twiml: this.buildEmergencyTwiml(userName, alertId)
        });
        logger.info(`Twilio call initiated to ${recipientPhone} for alert ${alertId} (SID: ${call.sid})`);
        return { status: 'queued', sid: call.sid };
      } catch (err: any) {
        // Trial accounts can only call verified numbers — log but do not crash the alert flow
        logger.error(`Twilio call to ${recipientPhone} failed: ${err.message}`);
        return { status: 'failed', code: err.code };
      }
    }

    logger.info(`[MOCK-TWILIO-IVR] Would call ${recipientPhone} (${userName}) for alert ${alertId}`);
    return { status: 'not_configured' };
  }

  /** TwiML for the /api/alerts/:id/twiml route (kept for prod/ngrok setup) */
  public generateGatherTwiml(alertId: string): string {
    const base = process.env.TWILIO_PUBLIC_BASE_URL || process.env.PUBLIC_API_URL;
    const responseActionUrl = base ? `${base.replace(/\/$/, '')}/api/alerts/${alertId}/response` : `/api/alerts/${alertId}/response`;
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
    const base = process.env.TWILIO_PUBLIC_BASE_URL || process.env.PUBLIC_API_URL;
    const recordActionUrl = base ? `${base.replace(/\/$/, '')}/api/alerts/${alertId}/voice-upload` : `/api/alerts/${alertId}/voice-upload`;
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

