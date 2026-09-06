import { prisma } from '../../shared/database/prisma';
import { WebSocketService } from '../../shared/websocket/socket.server';
import { geofenceService } from './geofence.service';
import { twilioService } from '../external/twilio.service';
import { whisperNlpService } from '../external/whisper.service';
import { logger } from '../../shared/logging/logger';
import { AlertStatus, DisasterType, SeverityLevel, UrgencyLevel } from '#sajag-types';

export class AlertStateMachineService {
  private ws = WebSocketService.getInstance();

  public async triggerDisasterAlert(params: {
    type: DisasterType;
    riskScore: number;
    severity: SeverityLevel;
    latitude: number;
    longitude: number;
    radiusMeters?: number;
    isSimulation?: boolean;
    title?: string;
    description?: string;
  }) {
    logger.warn(`🚨 Triggering Alert State Machine: ${params.type} (Score: ${params.riskScore}, Severity: ${params.severity})`);

    const disasterEvent = await prisma.disasterEvent.create({
      data: {
        type: params.type,
        riskScore: params.riskScore,
        severity: params.severity,
        latitude: params.latitude,
        longitude: params.longitude,
        radiusMeters: params.radiusMeters || 5000,
        status: 'DETECTED',
        isSimulation: params.isSimulation ?? false,
        title: params.title || `${params.severity} ${params.type} Alert`,
        description: params.description || `Immediate hazard detected around coordinates (${params.latitude}, ${params.longitude}).`
      }
    });

    this.ws.emit('alert:new', disasterEvent);

    await prisma.disasterEvent.update({
      where: { id: disasterEvent.id },
      data: { status: 'CONFIRMED' }
    });

    const affectedUsers = await geofenceService.findUsersInRadius(
      params.latitude,
      params.longitude,
      params.radiusMeters || 5000
    );

    logger.info(`Geofence identified ${affectedUsers.length} citizens in ${params.radiusMeters || 5000}m radius.`);

    for (const user of affectedUsers) {
      const alert = await prisma.alert.create({
        data: {
          eventId: disasterEvent.id,
          userId: user.id,
          status: 'NOTIFYING',
          attempts: 1
        }
      });

      await twilioService.placeEmergencyCall(alert.id, user.phone, user.name);

      await prisma.alert.update({
        where: { id: alert.id },
        data: { status: 'WAITING_RESPONSE' }
      });

      this.ws.emit('alert:update', {
        alertId: alert.id,
        status: 'WAITING_RESPONSE'
      });
    }

    return disasterEvent;
  }

  public async handleUserResponse(params: {
    alertId: string;
    response: 'SAFE' | 'UNSAFE';
    voiceTranscript?: string;
  }) {
    const alert = await prisma.alert.findUnique({
      where: { id: params.alertId },
      include: { user: true, event: true }
    });

    if (!alert) {
      throw new Error(`Alert not found: ${params.alertId}`);
    }

    let urgency: UrgencyLevel | null = null;
    let message = params.voiceTranscript || null;

    if (params.response === 'UNSAFE' && message) {
      const nlpResult = whisperNlpService.classifyUrgency(message);
      urgency = nlpResult.urgency;
    }

    const userResponse = await prisma.userResponse.create({
      data: {
        alertId: alert.id,
        userId: alert.userId,
        response: params.response,
        message,
        urgency
      },
      include: { user: true }
    });

    const newStatus: AlertStatus = params.response === 'SAFE' ? 'SAFE' : 'UNSAFE';
    await prisma.alert.update({
      where: { id: alert.id },
      data: { status: newStatus }
    });

    await prisma.user.update({
      where: { id: alert.userId },
      data: { status: newStatus }
    });

    logger.info(`User ${alert.user.name} responded ${params.response} (Urgency: ${urgency || 'N/A'})`);

    this.ws.emit('response:new', userResponse);
    this.ws.emit('alert:update', {
      alertId: alert.id,
      status: newStatus,
      response: userResponse
    });

    return userResponse;
  }
}

export const alertStateMachine = new AlertStateMachineService();
