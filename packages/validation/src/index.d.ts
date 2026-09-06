import { z } from 'zod';
export declare const geoLocationSchema: z.ZodObject<{
    lat: z.ZodNumber;
    lng: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    lat: number;
    lng: number;
}, {
    lat: number;
    lng: number;
}>;
export declare const sensorValuesSchema: z.ZodObject<{
    acceleration: z.ZodNumber;
    waterLevel: z.ZodNumber;
    soilMoisture: z.ZodNumber;
    rainfall: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    acceleration: number;
    waterLevel: number;
    soilMoisture: number;
    rainfall: number;
}, {
    acceleration: number;
    waterLevel: number;
    soilMoisture: number;
    rainfall: number;
}>;
export declare const telemetryPayloadSchema: z.ZodObject<{
    deviceId: z.ZodString;
    timestamp: z.ZodDefault<z.ZodString>;
    location: z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
    }, {
        lat: number;
        lng: number;
    }>;
    sensors: z.ZodObject<{
        acceleration: z.ZodNumber;
        waterLevel: z.ZodNumber;
        soilMoisture: z.ZodNumber;
        rainfall: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        acceleration: number;
        waterLevel: number;
        soilMoisture: number;
        rainfall: number;
    }, {
        acceleration: number;
        waterLevel: number;
        soilMoisture: number;
        rainfall: number;
    }>;
}, "strip", z.ZodTypeAny, {
    deviceId: string;
    timestamp: string;
    location: {
        lat: number;
        lng: number;
    };
    sensors: {
        acceleration: number;
        waterLevel: number;
        soilMoisture: number;
        rainfall: number;
    };
}, {
    deviceId: string;
    location: {
        lat: number;
        lng: number;
    };
    sensors: {
        acceleration: number;
        waterLevel: number;
        soilMoisture: number;
        rainfall: number;
    };
    timestamp?: string | undefined;
}>;
export declare const heartbeatPayloadSchema: z.ZodObject<{
    deviceId: z.ZodString;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    deviceId: string;
    timestamp?: string | undefined;
}, {
    deviceId: string;
    timestamp?: string | undefined;
}>;
export declare const twilioResponseSchema: z.ZodObject<{
    response: z.ZodEnum<["SAFE", "UNSAFE"]>;
    message: z.ZodOptional<z.ZodString>;
    urgency: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>>;
}, "strip", z.ZodTypeAny, {
    response: "SAFE" | "UNSAFE";
    message?: string | undefined;
    urgency?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;
}, {
    response: "SAFE" | "UNSAFE";
    message?: string | undefined;
    urgency?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;
}>;
export declare const sosCreateSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    addressText: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    numberOfPeople: z.ZodDefault<z.ZodNumber>;
    medicalEmergency: z.ZodDefault<z.ZodEnum<["NONE", "MINOR", "SEVERE", "CRITICAL"]>>;
    contactNumber: z.ZodString;
}, "strip", z.ZodTypeAny, {
    description: string;
    latitude: number;
    longitude: number;
    numberOfPeople: number;
    medicalEmergency: "CRITICAL" | "NONE" | "MINOR" | "SEVERE";
    contactNumber: string;
    addressText?: string | undefined;
}, {
    description: string;
    latitude: number;
    longitude: number;
    contactNumber: string;
    addressText?: string | undefined;
    numberOfPeople?: number | undefined;
    medicalEmergency?: "CRITICAL" | "NONE" | "MINOR" | "SEVERE" | undefined;
}>;
export declare const sosStatusUpdateSchema: z.ZodObject<{
    status: z.ZodEnum<["PENDING", "ACKNOWLEDGED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CANCELLED"]>;
    assignedTeamId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "PENDING" | "ACKNOWLEDGED" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";
    assignedTeamId?: string | undefined;
}, {
    status: "PENDING" | "ACKNOWLEDGED" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";
    assignedTeamId?: string | undefined;
}>;
export declare const citizenReportCreateSchema: z.ZodObject<{
    disasterType: z.ZodEnum<["FLOOD", "LANDSLIDE", "EARTHQUAKE", "FOREST_FIRE", "STORM", "OTHER"]>;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    addressText: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    mediaUrls: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    description: string;
    latitude: number;
    longitude: number;
    disasterType: "FLOOD" | "LANDSLIDE" | "EARTHQUAKE" | "FOREST_FIRE" | "STORM" | "OTHER";
    mediaUrls: string[];
    addressText?: string | undefined;
}, {
    description: string;
    latitude: number;
    longitude: number;
    disasterType: "FLOOD" | "LANDSLIDE" | "EARTHQUAKE" | "FOREST_FIRE" | "STORM" | "OTHER";
    addressText?: string | undefined;
    mediaUrls?: string[] | undefined;
}>;
export declare const simulateScenarioSchema: z.ZodObject<{
    scenario: z.ZodEnum<["NORMAL", "FLOOD", "EARTHQUAKE", "LANDSLIDE"]>;
    targetDeviceId: z.ZodOptional<z.ZodString>;
    durationSeconds: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    scenario: "FLOOD" | "LANDSLIDE" | "EARTHQUAKE" | "NORMAL";
    durationSeconds: number;
    targetDeviceId?: string | undefined;
}, {
    scenario: "FLOOD" | "LANDSLIDE" | "EARTHQUAKE" | "NORMAL";
    targetDeviceId?: string | undefined;
    durationSeconds?: number | undefined;
}>;
export declare const simulateNetworkModeSchema: z.ZodObject<{
    mode: z.ZodEnum<["NORMAL", "LORA_FALLBACK"]>;
    deviceId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    mode: "NORMAL" | "LORA_FALLBACK";
    deviceId?: string | undefined;
}, {
    mode: "NORMAL" | "LORA_FALLBACK";
    deviceId?: string | undefined;
}>;
export declare const authLoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const authRegisterSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["CITIZEN", "RESPONDER", "RESCUE_TEAM", "AUTHORITY", "ADMIN"]>>;
    latitude: z.ZodDefault<z.ZodNumber>;
    longitude: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    latitude: number;
    longitude: number;
    email: string;
    password: string;
    phone: string;
    role: "CITIZEN" | "RESPONDER" | "RESCUE_TEAM" | "AUTHORITY" | "ADMIN";
}, {
    name: string;
    email: string;
    password: string;
    phone: string;
    latitude?: number | undefined;
    longitude?: number | undefined;
    role?: "CITIZEN" | "RESPONDER" | "RESCUE_TEAM" | "AUTHORITY" | "ADMIN" | undefined;
}>;
//# sourceMappingURL=index.d.ts.map