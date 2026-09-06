// ==========================================
// SAJAG / PRAKOP - SHARED VALIDATION SCHEMAS
// ==========================================

import { z } from 'zod';

export const geoLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

export const sensorValuesSchema = z.object({
  acceleration: z.number(),
  waterLevel: z.number().min(0),
  soilMoisture: z.number().min(0).max(100),
  rainfall: z.number().min(0)
});

// Telemetry from MQTT / the local LoRa gateway
export const telemetryPayloadSchema = z.object({
  deviceId: z.string().min(1),
  timestamp: z.string().datetime({ offset: true }).default(() => new Date().toISOString()),
  location: geoLocationSchema,
  sensors: sensorValuesSchema
});

// Heartbeat
export const heartbeatPayloadSchema = z.object({
  deviceId: z.string().min(1),
  timestamp: z.string().optional()
});

// Twilio DTMF Response
export const twilioResponseSchema = z.object({
  response: z.enum(['SAFE', 'UNSAFE']),
  message: z.string().optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional()
});

// SOS Request Creation
export const sosCreateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  addressText: z.string().optional(),
  description: z.string().min(3, "Please describe what is happening"),
  numberOfPeople: z.number().int().min(1).default(1),
  medicalEmergency: z.enum(['NONE', 'MINOR', 'SEVERE', 'CRITICAL']).default('NONE'),
  contactNumber: z.string().min(6)
});

// SOS Status Update
export const sosStatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']),
  assignedTeamId: z.string().uuid().optional()
});

// Citizen Report
export const citizenReportCreateSchema = z.object({
  disasterType: z.enum(['FLOOD', 'LANDSLIDE', 'EARTHQUAKE', 'FOREST_FIRE', 'STORM', 'ROAD_BLOCKED', 'OTHER']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  addressText: z.string().optional(),
  description: z.string().min(5),
  // Uploaded photos come back from storageService as API-relative paths
  // (e.g. "/api/files/reports/xyz.jpg"), not absolute URLs — matches how
  // photoUrl is stored elsewhere, so this must not require a full URL.
  mediaUrls: z.array(z.string()).default([])
});

// Scenario Simulation
export const simulateScenarioSchema = z.object({
  scenario: z.enum(['NORMAL', 'FLOOD', 'EARTHQUAKE', 'LANDSLIDE']),
  targetDeviceId: z.string().optional(),
  durationSeconds: z.number().int().min(5).max(300).default(30)
});

// Network Mode Simulation (WiFi vs LoRa fallback)
export const simulateNetworkModeSchema = z.object({
  mode: z.enum(['NORMAL', 'LORA_FALLBACK']),
  deviceId: z.string().optional()
});

// Auth
export const authLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const authRegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(7),
  role: z.enum(['CITIZEN', 'RESPONDER', 'RESCUE_TEAM', 'AUTHORITY', 'ADMIN']).default('CITIZEN'),
  latitude: z.number().default(27.7172),
  longitude: z.number().default(85.3240)
});

// Passwordless self check-in used by the citizen portal's one-step
// registration (name + phone + email + optional RustFS photo, no password).
// These accounts authenticate only via the token returned at registration —
// they have no passwordHash and cannot use the email/password login.
export const quickRegisterSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email(),
  photoUrl: z.string().optional(),
  latitude: z.number().default(27.7172),
  longitude: z.number().default(85.3240)
});
