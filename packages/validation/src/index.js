"use strict";
// ==========================================
// SAJAG / PRAKOP - SHARED VALIDATION SCHEMAS
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRegisterSchema = exports.authLoginSchema = exports.simulateNetworkModeSchema = exports.simulateScenarioSchema = exports.citizenReportCreateSchema = exports.sosStatusUpdateSchema = exports.sosCreateSchema = exports.twilioResponseSchema = exports.heartbeatPayloadSchema = exports.telemetryPayloadSchema = exports.sensorValuesSchema = exports.geoLocationSchema = void 0;
const zod_1 = require("zod");
exports.geoLocationSchema = zod_1.z.object({
    lat: zod_1.z.number().min(-90).max(90),
    lng: zod_1.z.number().min(-180).max(180)
});
exports.sensorValuesSchema = zod_1.z.object({
    acceleration: zod_1.z.number(),
    waterLevel: zod_1.z.number().min(0),
    soilMoisture: zod_1.z.number().min(0).max(100),
    rainfall: zod_1.z.number().min(0)
});
// Telemetry from MQTT / the local LoRa gateway
exports.telemetryPayloadSchema = zod_1.z.object({
    deviceId: zod_1.z.string().min(1),
    timestamp: zod_1.z.string().datetime({ offset: true }).default(() => new Date().toISOString()),
    location: exports.geoLocationSchema,
    sensors: exports.sensorValuesSchema
});
// Heartbeat
exports.heartbeatPayloadSchema = zod_1.z.object({
    deviceId: zod_1.z.string().min(1),
    timestamp: zod_1.z.string().optional()
});
// Twilio DTMF Response
exports.twilioResponseSchema = zod_1.z.object({
    response: zod_1.z.enum(['SAFE', 'UNSAFE']),
    message: zod_1.z.string().optional(),
    urgency: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional()
});
// SOS Request Creation
exports.sosCreateSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    addressText: zod_1.z.string().optional(),
    description: zod_1.z.string().min(3, "Please describe what is happening"),
    numberOfPeople: zod_1.z.number().int().min(1).default(1),
    medicalEmergency: zod_1.z.enum(['NONE', 'MINOR', 'SEVERE', 'CRITICAL']).default('NONE'),
    contactNumber: zod_1.z.string().min(6)
});
// SOS Status Update
exports.sosStatusUpdateSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']),
    assignedTeamId: zod_1.z.string().uuid().optional()
});
// Citizen Report
exports.citizenReportCreateSchema = zod_1.z.object({
    disasterType: zod_1.z.enum(['FLOOD', 'LANDSLIDE', 'EARTHQUAKE', 'FOREST_FIRE', 'STORM', 'OTHER']),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    addressText: zod_1.z.string().optional(),
    description: zod_1.z.string().min(5),
    mediaUrls: zod_1.z.array(zod_1.z.string().url()).default([])
});
// Scenario Simulation
exports.simulateScenarioSchema = zod_1.z.object({
    scenario: zod_1.z.enum(['NORMAL', 'FLOOD', 'EARTHQUAKE', 'LANDSLIDE']),
    targetDeviceId: zod_1.z.string().optional(),
    durationSeconds: zod_1.z.number().int().min(5).max(300).default(30)
});
// Network Mode Simulation (WiFi vs LoRa fallback)
exports.simulateNetworkModeSchema = zod_1.z.object({
    mode: zod_1.z.enum(['NORMAL', 'LORA_FALLBACK']),
    deviceId: zod_1.z.string().optional()
});
// Auth
exports.authLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6)
});
exports.authRegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    phone: zod_1.z.string().min(7),
    role: zod_1.z.enum(['CITIZEN', 'RESPONDER', 'RESCUE_TEAM', 'AUTHORITY', 'ADMIN']).default('CITIZEN'),
    latitude: zod_1.z.number().default(27.7172),
    longitude: zod_1.z.number().default(85.3240)
});
//# sourceMappingURL=index.js.map