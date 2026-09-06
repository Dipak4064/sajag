import { telemetryPayloadSchema } from '@sajag/validation';
import { TelemetryPayload } from '@sajag/types';

/** Converts external transport envelopes into the one internal telemetry shape. */
export function parseTelemetryPayload(value: unknown): TelemetryPayload {
  return telemetryPayloadSchema.parse(value);
}

export function parseMqttTelemetry(topic: string, body: Buffer | string): TelemetryPayload {
  const parts = topic.split('/');
  if (parts.length !== 4 || parts[0] !== 'prakop' || parts[1] !== 'device' || parts[3] !== 'telemetry') {
    throw new Error(`Unsupported telemetry topic: ${topic}`);
  }

  const payload = parseTelemetryPayload(JSON.parse(body.toString()));
  if (payload.deviceId !== parts[2]) throw new Error('Topic and payload device IDs differ');
  return payload;
}

export function parseLoRaEnvelope(value: unknown): TelemetryPayload {
  if (!value || typeof value !== 'object' || !('payload' in value)) {
    return parseTelemetryPayload(value);
  }
  return parseTelemetryPayload((value as { payload: unknown }).payload);
}
