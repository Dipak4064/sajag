import { GeoLocation, TransportType } from '#sajag-types';

export interface VirtualDeviceConfig {
  deviceId: string;
  name: string;
  location: GeoLocation;
  zoneType: 'RIVER_FLOOD' | 'HILL_SLOPE' | 'URBAN_SEISMIC';
  transport: TransportType;
  isActive: boolean;
}

export const KATHMANDU_VIRTUAL_DEVICES: VirtualDeviceConfig[] = [
  {
    deviceId: 'ESP32-KTM-001',
    name: 'Bagmati River Sensor - Balkhu',
    location: { lat: 27.6895, lng: 85.3021 },
    zoneType: 'RIVER_FLOOD',
    transport: 'MQTT',
    isActive: true
  },
  {
    deviceId: 'ESP32-KTM-002',
    name: 'Bishnumati River Sensor - Shova Bhagwati',
    location: { lat: 27.7153, lng: 85.3015 },
    zoneType: 'RIVER_FLOOD',
    transport: 'MQTT',
    isActive: true
  },
  {
    deviceId: 'ESP32-KTM-003',
    name: 'Shivapuri Hillside Sensor - Sundarijal',
    location: { lat: 27.7942, lng: 85.3850 },
    zoneType: 'HILL_SLOPE',
    transport: 'MQTT',
    isActive: true
  },
  {
    deviceId: 'ESP32-KTM-004',
    name: 'Patan Historical Core Sensor',
    location: { lat: 27.6726, lng: 85.3255 },
    zoneType: 'URBAN_SEISMIC',
    transport: 'MQTT',
    isActive: true
  },
  {
    deviceId: 'ESP32-KTM-005',
    name: 'Hanumante River Sensor - Bhaktapur',
    location: { lat: 27.6710, lng: 85.4298 },
    zoneType: 'RIVER_FLOOD',
    transport: 'MQTT',
    isActive: true
  },
  {
    deviceId: 'ESP32-KTM-006',
    name: 'Chandragiri Escarpment Sensor',
    location: { lat: 27.6698, lng: 85.2085 },
    zoneType: 'HILL_SLOPE',
    transport: 'MQTT',
    isActive: true
  },
  {
    deviceId: 'ESP32-KTM-007',
    name: 'Kalanki Highway Junction Sensor',
    location: { lat: 27.6934, lng: 85.2816 },
    zoneType: 'URBAN_SEISMIC',
    transport: 'MQTT',
    isActive: true
  },
  {
    deviceId: 'ESP32-KTM-008',
    name: 'Kirtipur Historic Ridge Sensor',
    location: { lat: 27.6798, lng: 85.2755 },
    zoneType: 'HILL_SLOPE',
    transport: 'MQTT',
    isActive: true
  },
  {
    deviceId: 'ESP32-MOBILE-USB-01',
    name: 'USB Mobile Phone ESP32 Bridge',
    location: { lat: 27.6910, lng: 85.3040 },
    zoneType: 'URBAN_SEISMIC',
    transport: 'MQTT',
    isActive: true
  }
];
