import { Router } from 'express';
import { prisma } from '../db/prisma';
import { alertStateMachine } from '../services/alert.service';
import { twilioService } from '../services/twilio.service';
import { whisperNlpService } from '../services/whisper.service';

export const alertsRouter = Router();

// GET /api/alerts
alertsRouter.get('/', async (req, res, next) => {
  try {
    const events = await prisma.disasterEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        alerts: {
          include: {
            user: true,
            responses: true
          }
        }
      }
    });

    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
});

// GET /api/alerts/active
alertsRouter.get('/active', async (req, res, next) => {
  try {
    const events = await prisma.disasterEvent.findMany({
      where: {
        status: { in: ['DETECTED', 'ANALYZING', 'CONFIRMED', 'NOTIFYING'] }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        alerts: {
          include: {
            user: true,
            responses: true
          }
        }
      }
    });

    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
});

// TwiML IVR Gather XML for Twilio calls
alertsRouter.get('/:id/twiml', (req, res) => {
  const twiml = twilioService.generateGatherTwiml(req.params.id);
  res.type('text/xml').send(twiml);
});

// Handle User Response (From Twilio DTMF digits or Web UI)
alertsRouter.post('/:id/response', async (req, res, next) => {
  try {
    const alertId = req.params.id;
    // Twilio sends Digits in body, or direct JSON { response: 'SAFE' | 'UNSAFE' }
    let responseType: 'SAFE' | 'UNSAFE' = 'SAFE';

    if (req.body.Digits) {
      if (req.body.Digits === '1') {
        responseType = 'SAFE';
      } else if (req.body.Digits === '2') {
        responseType = 'UNSAFE';
        // If DTMF 2, return TwiML to record voice
        const recordTwiml = twilioService.generateRecordTwiml(alertId);
        return res.type('text/xml').send(recordTwiml);
      }
    } else if (req.body.response) {
      responseType = req.body.response;
    }

    const result = await alertStateMachine.handleUserResponse({
      alertId,
      response: responseType,
      voiceTranscript: req.body.message
    });

    // If Twilio called this webhook, reply with TwiML
    if (req.body.Digits) {
      return res.type('text/xml').send(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Your response has been registered. Stay safe.</Say><Hangup/></Response>`
      );
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Twilio Voice Recording callback
alertsRouter.post('/:id/voice-upload', async (req, res, next) => {
  try {
    const alertId = req.params.id;
    const recordingUrl = req.body.RecordingUrl;

    // Transcribe with Whisper service
    const transcript = await whisperNlpService.transcribeAudio(recordingUrl || '');

    const result = await alertStateMachine.handleUserResponse({
      alertId,
      response: 'UNSAFE',
      voiceTranscript: transcript
    });

    res.type('text/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Your emergency message has been transcribed. Help is being dispatched.</Say><Hangup/></Response>`
    );
  } catch (err) {
    next(err);
  }
});
