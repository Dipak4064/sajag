'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components with SSR disabled
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

interface LiveMapProps {
  devices?: any[];
  disasters?: any[];
  users?: any[];
  shelters?: any[];
  sosList?: any[];
  onSelectDevice?: (deviceId: string) => void;
}

export default function LiveMap({
  devices = [],
  disasters = [],
  users = [],
  shelters = [],
  sosList = [],
  onSelectDevice
}: LiveMapProps) {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
      setMounted(true);
    });
  }, []);

  if (!mounted || !L) {
    return (
      <div className="w-full h-full min-h-[450px] bg-slate-900 flex items-center justify-center text-slate-500 text-sm">
        Loading GIS Tactical Map...
      </div>
    );
  }

  // Create Custom Leaflet SVG DivIcons
  const createSensorIcon = (transport: string) => {
    const isLoRa = transport === 'LORA_SIM';
    return L.divIcon({
      className: 'custom-sensor-icon',
      html: `
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #1e293b;
          border: 3px ${isLoRa ? 'dashed #f59e0b' : 'solid #3b82f6'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          box-shadow: 0 0 10px ${isLoRa ? 'rgba(245, 158, 11, 0.6)' : 'rgba(59, 130, 246, 0.6)'};
        ">
          ${isLoRa ? '📡' : '📶'}
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  };

  const createSOSIcon = () =>
    L.divIcon({
      className: 'custom-sos-icon',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ef4444;
          border: 3px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          box-shadow: 0 0 14px #ef4444;
          animation: pulse 1s infinite;
        ">
          🆘
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

  const createShelterIcon = () =>
    L.divIcon({
      className: 'custom-shelter-icon',
      html: `
        <div style="
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
        ">
          🏠
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

  const createUserIcon = (status: string) => {
    const color =
      status === 'SAFE' ? '#10b981' : status === 'UNSAFE' ? '#ef4444' : '#64748b';
    return L.divIcon({
      className: 'custom-user-icon',
      html: `
        <div style="
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${color};
          border: 2px solid #ffffff;
          box-shadow: 0 0 6px ${color};
        "></div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  };

  return (
    <div className="w-full h-full min-h-[450px] relative rounded-xl overflow-hidden border border-slate-800">
      <MapContainer
        center={[27.705, 85.315]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Disaster Danger Circles (5km radius default) */}
        {disasters.map((d) => (
          <Circle
            key={d.id}
            center={[d.latitude, d.longitude]}
            radius={d.radiusMeters || 5000}
            pathOptions={{
              color: d.severity === 'CRITICAL' ? '#ef4444' : '#f97316',
              fillColor: d.severity === 'CRITICAL' ? '#ef4444' : '#f97316',
              fillOpacity: 0.18,
              dashArray: '4, 8'
            }}
          >
            <Popup>
              <div className="text-slate-900 text-xs">
                <strong>{d.title}</strong>
                <p>Severity: {d.severity}</p>
                <p>Risk Score: {d.riskScore}/100</p>
                <p>Radius: {d.radiusMeters}m</p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Virtual ESP32 Sensors */}
        {devices.map((dev) => (
          <Marker
            key={dev.id || dev.deviceId}
            position={[dev.latitude, dev.longitude]}
            icon={createSensorIcon(dev.transport)}
            eventHandlers={{
              click: () => onSelectDevice && onSelectDevice(dev.deviceId)
            }}
          >
            <Popup>
              <div className="text-slate-900 text-xs space-y-1">
                <div className="font-bold text-sm">{dev.name}</div>
                <div>ID: <code>{dev.deviceId}</code></div>
                <div>
                  Transport:{' '}
                  <span
                    className={`font-bold ${
                      dev.transport === 'LORA_SIM' ? 'text-amber-600' : 'text-blue-600'
                    }`}
                  >
                    {dev.transport === 'LORA_SIM' ? '📡 LoRa Fallback (Sim)' : '📶 WiFi / MQTT'}
                  </span>
                </div>
                {dev.readings && dev.readings[0] && (
                  <div className="mt-1 pt-1 border-t text-[11px]">
                    <div>Water: {dev.readings[0].waterLevel} cm</div>
                    <div>Rain: {dev.readings[0].rainfall} mm/hr</div>
                    <div>Accel: {dev.readings[0].acceleration} g</div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Shelters */}
        {shelters.map((s) => (
          <Marker
            key={s.id}
            position={[s.latitude, s.longitude]}
            icon={createShelterIcon()}
          >
            <Popup>
              <div className="text-slate-900 text-xs">
                <strong>{s.name}</strong>
                <p>{s.address}</p>
                <p>Available: {s.totalCapacity - s.currentOccupancy} / {s.totalCapacity}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Active SOS Distress */}
        {sosList.map((sos) => (
          <Marker
            key={sos.id}
            position={[sos.latitude, sos.longitude]}
            icon={createSOSIcon()}
          >
            <Popup>
              <div className="text-slate-900 text-xs space-y-1">
                <strong className="text-red-600 font-bold">🆘 ACTIVE RESCUE DISTRESS</strong>
                <p><strong>People:</strong> {sos.numberOfPeople}</p>
                <p><strong>Medical:</strong> {sos.medicalEmergency}</p>
                <p><strong>Description:</strong> {sos.description}</p>
                <p><strong>Contact:</strong> {sos.contactNumber}</p>
                <p><strong>Status:</strong> {sos.status}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Citizen Safety Dots */}
        {users.map((u) => (
          <Marker
            key={u.id}
            position={[u.latitude, u.longitude]}
            icon={createUserIcon(u.status)}
          >
            <Popup>
              <div className="text-slate-900 text-xs">
                <strong>{u.name}</strong>
                <p>Status: <span className="font-bold">{u.status}</span></p>
                <p>Phone: {u.phone}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
