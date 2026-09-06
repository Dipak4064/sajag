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

// Telemetry from MQTT / Firebase
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
  disasterType: z.enum(['FLOOD', 'LANDSLIDE', 'EARTHQUAKE', 'FOREST_FIRE', 'STORM', 'OTHER']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  addressText: z.string().optional(),
  description: z.string().min(5),
  mediaUrls: z.array(z.string().url()).default([])
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
