// ==========================================
// SAJAG / PRAKOP - SHARED TYPES (@sajag/types)
// ==========================================

export type TransportType = 'MQTT' | 'LORA_SIM';

export type DeviceStatus = 'ONLINE' | 'OFFLINE';

export type DisasterType = 
  | 'EARTHQUAKE' 
  | 'FLOOD' 
  | 'LANDSLIDE' 
  | 'FOREST_FIRE' 
  | 'STORM' 
  | 'OTHER';

export type SeverityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type DisasterEventStatus = 
  | 'DETECTED' 
  | 'ANALYZING' 
  | 'CONFIRMED' 
  | 'NOTIFYING' 
  | 'RESOLVED';

export type AlertStatus = 
  | 'NOTIFYING' 
  | 'WAITING_RESPONSE' 
  | 'SAFE' 
  | 'UNSAFE' 
  | 'NO_RESPONSE' 
  | 'ESCALATED';

export type CitizenSafetyStatus = 'SAFE' | 'UNSAFE' | 'NO_RESPONSE' | 'UNKNOWN';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type UserRole = 
  | 'CITIZEN' 
  | 'RESPONDER' 
  | 'RESCUE_TEAM' 
  | 'AUTHORITY' 
  | 'ADMIN' 
  | 'SUPER_ADMIN';

export type SOSStatus = 
  | 'PENDING' 
  | 'ACKNOWLEDGED' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'RESOLVED' 
  | 'CANCELLED';

export type MedicalUrgency = 'NONE' | 'MINOR' | 'SEVERE' | 'CRITICAL';

export type RescueTeamType = 
  | 'ARMY' 
  | 'POLICE' 
  | 'RED_CROSS' 
  | 'FIRE_DEPARTMENT' 
  | 'LOCAL_VOLUNTEER';

export type RescueTeamStatus = 
  | 'AVAILABLE' 
  | 'DISPATCHED' 
  | 'ON_SITE' 
  | 'RESTING' 
  | 'OFFLINE';

export type ReportStatus = 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'VERIFIED' 
  | 'REJECTED' 
  | 'RESOLVED';

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface SensorValues {
  acceleration: number; // m/s^2 or g-force (Earthquake: normal ~0.0-0.4, quake > 1.2)
  waterLevel: number;   // cm or % (Flood: normal 10-30, danger > 80)
  soilMoisture: number; // % saturation (Landslide: normal 20-50, danger > 85)
  rainfall: number;     // mm/hr (Rain: normal 0-10, heavy > 50)
}

export interface TelemetryPayload {
  radiusMeters?: number;
  deviceId: string;
  timestamp: string;
  location: GeoLocation;
  sensors: SensorValues;
}

export interface DeviceEntity {
  id: string;
  deviceId: string;
  name: string;
  latitude: number;
  longitude: number;
  status: DeviceStatus;
  transport: TransportType;
  lastHeartbeat: string | null;
  municipalityId: string;
}

export interface SensorReadingEntity {
  id: string;
  deviceId: string;
  acceleration: number;
  waterLevel: number;
  soilMoisture: number;
  rainfall: number;
  transport: TransportType;
  timestamp: string;
}

export interface RiskScoreBreakdown {
  earthquakeScore: number;
  waterScore: number;
  soilScore: number;
  rainfallScore: number;
  overallScore: number;
  severity: SeverityLevel;
}

export interface DisasterEventEntity {
  id: string;
  type: DisasterType;
  riskScore: number;
  severity: SeverityLevel;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  status: DisasterEventStatus;
  createdAt: string;
  title?: string;
  description?: string;
}

export interface AlertEntity {
  id: string;
  eventId: string;
  userId: string;
  status: AlertStatus;
  attempts: number;
  createdAt: string;
  event?: DisasterEventEntity;
  user?: UserEntity;
  responses?: UserResponseEntity[];
}

export interface UserResponseEntity {
  id: string;
  alertId: string;
  userId: string;
  response: 'SAFE' | 'UNSAFE';
  message: string | null;
  urgency: UrgencyLevel | null;
  createdAt: string;
  user?: UserEntity;
}

export interface UserEntity {
  id: string;
  name: string;
  email?: string;
  phone: string;
  latitude: number;
  longitude: number;
  status: CitizenSafetyStatus;
  role?: UserRole;
  municipalityId: string;
}

export interface SOSRequestEntity {
  id: string;
  userId: string;
  user?: UserEntity;
  latitude: number;
  longitude: number;
  addressText?: string;
  description: string;
  numberOfPeople: number;
  medicalEmergency: MedicalUrgency;
  status: SOSStatus;
  contactNumber: string;
  createdAt: string;
  resolvedAt?: string | null;
  assignedTeamId?: string | null;
  assignedTeam?: RescueTeamEntity | null;
}

export interface RescueTeamEntity {
  id: string;
  name: string;
  teamType: RescueTeamType;
  status: RescueTeamStatus;
  latitude: number;
  longitude: number;
  capacity: number;
  contactRadioFreq?: string;
  leadOfficerName: string;
}

export interface ShelterEntity {
  id: string;
  name: string;
  nameNe?: string;
  latitude: number;
  longitude: number;
  address: string;
  totalCapacity: number;
  currentOccupancy: number;
  hasMedicalFacility: boolean;
  hasFoodWater: boolean;
  hasBackupPower: boolean;
  isActive: boolean;
  distanceMeters?: number;
}

export interface CitizenReportEntity {
  id: string;
  userId: string;
  disasterType: DisasterType;
  latitude: number;
  longitude: number;
  addressText?: string;
  description: string;
  mediaUrls: string[];
  status: ReportStatus;
  createdAt: string;
}

export interface MunicipalityEntity {
  id: string;
  name: string;
}

// Simulator & Scenario Types
export type ScenarioMode = 'NORMAL' | 'FLOOD' | 'EARTHQUAKE' | 'LANDSLIDE';

export interface SimulateScenarioPayload {
  scenario: ScenarioMode;
  targetDeviceId?: string;
  durationSeconds?: number;
}

export interface SimulateNetworkModePayload {
  mode: 'NORMAL' | 'LORA_FALLBACK';
  deviceId?: string;
}

// Socket.IO Events
export interface SocketEventsMap {
  'reading:new': (reading: SensorReadingEntity) => void;
  'device:status': (payload: { deviceId: string; status: DeviceStatus; transport: TransportType }) => void;
  'alert:new': (event: DisasterEventEntity) => void;
  'alert:update': (payload: { alertId: string; status: AlertStatus; response?: UserResponseEntity }) => void;
  'response:new': (response: UserResponseEntity) => void;
  'sos:new': (sos: SOSRequestEntity) => void;
  'sos:update': (sos: SOSRequestEntity) => void;
  'report:new': (report: CitizenReportEntity) => void;
}
