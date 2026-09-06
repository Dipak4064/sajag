import { Request, Response, NextFunction } from 'express';
import { alertsRepository, AlertsRepository } from './alerts.repository';
import { alertStateMachine, AlertStateMachineService } from './alert.service';
import { twilioService } from '../external/twilio.service';
import { whisperNlpService } from '../external/whisper.service';

export class AlertsController {
  constructor(
    private repo: AlertsRepository = alertsRepository,
    private stateMachine: AlertStateMachineService = alertStateMachine
  ) {}

  public getAllAlerts = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const events = await this.repo.findAllEvents(20);
      res.json({ success: true, data: events });
    } catch (err) {
      next(err);
    }
  };

  public getActiveAlerts = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const events = await this.repo.findActiveEvents();
      res.json({ success: true, data: events });
    } catch (err) {
      next(err);
    }
  };

  public getTwiml = (req: Request, res: Response) => {
    const twiml = twilioService.generateGatherTwiml(req.params.id);
    res.type('text/xml').send(twiml);
  };

  public handleUserResponse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alertId = req.params.id;
      let responseType: 'SAFE' | 'UNSAFE' = 'SAFE';

      if (req.body.Digits) {
        if (req.body.Digits === '1') {
          responseType = 'SAFE';
        } else if (req.body.Digits === '2') {
          responseType = 'UNSAFE';
          const recordTwiml = twilioService.generateRecordTwiml(alertId);
          return res.type('text/xml').send(recordTwiml);
        }
      } else if (req.body.response) {
        responseType = req.body.response;
      }

      const result = await this.stateMachine.handleUserResponse({
        alertId,
        response: responseType,
        voiceTranscript: req.body.message
      });

      if (req.body.Digits) {
        return res.type('text/xml').send(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Your response has been registered. Stay safe.</Say><Hangup/></Response>`
        );
      }

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  public handleVoiceUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alertId = req.params.id;
      const recordingUrl = req.body.RecordingUrl;

      const transcript = await whisperNlpService.transcribeAudio(recordingUrl || '');

      await this.stateMachine.handleUserResponse({
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
  };
}

export const alertsController = new AlertsController();
