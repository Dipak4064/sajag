import { prisma } from '../db/prisma';
import { WebSocketService } from '../websocket/socket.server';
import { geofenceService } from './geofence.service';
import { twilioService } from './twilio.service';
import { whisperNlpService } from './whisper.service';
import { logger } from '../utils/logger';
import { AlertStatus, DisasterEventStatus, DisasterType, SeverityLevel, UrgencyLevel } from '@sajag/types';

export class AlertStateMachineService {
  private ws = WebSocketService.getInstance();

  /**
   * Triggers the alert state machine when high/critical risk is detected
   */
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

    // 1. Create DisasterEvent in 'DETECTED' status
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

    // 2. Transition: DETECTED -> ANALYZING -> CONFIRMED
    await prisma.disasterEvent.update({
      where: { id: disasterEvent.id },
      data: { status: 'CONFIRMED' }
    });

    // 3. Geofence nearby residents within radius
    const affectedUsers = await geofenceService.findUsersInRadius(
      params.latitude,
      params.longitude,
      params.radiusMeters || 5000
    );

    logger.info(`Geofence identified ${affectedUsers.length} citizens in ${params.radiusMeters || 5000}m radius.`);

    // 4. Create Alert records and dispatch calls
    for (const user of affectedUsers) {
      const alert = await prisma.alert.create({
        data: {
          eventId: disasterEvent.id,
          userId: user.id,
          status: 'NOTIFYING',
          attempts: 1
        }
      });

      // Place Twilio IVR Outbound Call (or simulated call)
      await twilioService.placeEmergencyCall(alert.id, user.phone, user.name);

      // Transition to WAITING_RESPONSE
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

  /**
   * Handles user response (from Twilio DTMF webhook or Web UI)
   */
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

    // 1. Record UserResponse
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

    // 2. Update Alert status
    const newStatus: AlertStatus = params.response === 'SAFE' ? 'SAFE' : 'UNSAFE';
    await prisma.alert.update({
      where: { id: alert.id },
      data: { status: newStatus }
    });

    // 3. Update User status
    await prisma.user.update({
      where: { id: alert.userId },
      data: { status: newStatus }
    });

    logger.info(`User ${alert.user.name} responded ${params.response} (Urgency: ${urgency || 'N/A'})`);

    // 4. Real-time push to dashboard
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
