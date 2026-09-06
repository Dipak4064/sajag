import { telemetryPayloadSchema } from '#sajag-validation';
import { TelemetryPayload } from '#sajag-types';

export function parseLoRaEnvelope(value: unknown): TelemetryPayload {
  if (!value || typeof value !== 'object' || !('payload' in value)) {
    return telemetryPayloadSchema.parse(value);
  }
  return telemetryPayloadSchema.parse((value as { payload: unknown }).payload);
}
