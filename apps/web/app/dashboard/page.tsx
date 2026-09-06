'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Radio, LifeBuoy, Users, AlertTriangle, ArrowUpRight } from 'lucide-react';
import LiveMap from '@/components/map/live-map';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function DashboardOverview() {
  const [devices, setDevices] = useState<any[]>([]);
  const [disasters, setDisasters] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [sosList, setSosList] = useState<any[]>([]);
  const [userTally, setUserTally] = useState({ SAFE: 0, UNSAFE: 0, NO_RESPONSE: 0, total: 30 });
  const [latestReadings, setLatestReadings] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [devRes, disRes, userRes, shelterRes, sosRes] = await Promise.all([
        api.get('/devices'),
        api.get('/alerts/active'),
        api.get('/users'),
        api.get('/shelters'),
        api.get('/sos/active')
      ]);

      if (devRes.data.success) setDevices(devRes.data.data);
      if (disRes.data.success) setDisasters(disRes.data.data);
      if (userRes.data.success) {
        setUsers(userRes.data.data.users);
        setUserTally(userRes.data.data.tally);
      }
      if (shelterRes.data.success) setShelters(shelterRes.data.data);
      if (sosRes.data.success) setSosList(sosRes.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchData();

    const socket = getSocket();

    socket.on('reading:new', (reading: any) => {
      setLatestReadings((prev) => [reading, ...prev.slice(0, 15)]);
      // Update device reading in state
      setDevices((prev) =>
        prev.map((d) => (d.id === reading.deviceId ? { ...d, readings: [reading] } : d))
      );
    });

    socket.on('device:status', ({ deviceId, status, transport }) => {
      setDevices((prev) =>
        prev.map((d) => (d.deviceId === deviceId ? { ...d, status, transport } : d))
      );
    });

    socket.on('alert:new', (event: any) => {
      setDisasters((prev) => [event, ...prev]);
    });

    socket.on('sos:new', (sos: any) => {
      setSosList((prev) => [sos, ...prev]);
    });

    socket.on('response:new', (response: any) => {
      fetchData(); // Refresh user statuses
    });

    return () => {
      socket.off('reading:new');
      socket.off('device:status');
      socket.off('alert:new');
      socket.off('sos:new');
      socket.off('response:new');
    };
  }, []);

  const loraCount = devices.filter((d) => d.transport === 'LORA_SIM').length;

  return (
    <div className="space-y-6">
      {/* 4 Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Active Disasters */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Hazards</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{disasters.length}</div>
          <div className="text-xs text-red-400 mt-1">
            {disasters.length > 0 ? `${disasters[0].severity} Alert Active` : 'All Basins Normal'}
          </div>
        </div>

        {/* Tile 2: SOS Distress */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Live SOS Triage</span>
            <LifeBuoy className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{sosList.length}</div>
          <div className="text-xs text-rose-400 mt-1">
            {sosList.length > 0 ? 'Pending Rescue Dispatch' : 'Zero Active Distresses'}
          </div>
        </div>

        {/* Tile 3: Resident Safety Status */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">IVR Citizen Status</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400">{userTally.SAFE}</span>
            <span className="text-xs text-slate-400">Safe</span>
            <span className="text-xl font-bold text-red-400 ml-2">{userTally.UNSAFE}</span>
            <span className="text-xs text-slate-400">Unsafe</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Total: {userTally.total} residents tracked</div>
        </div>

        {/* Tile 4: IoT Sensors & LoRa */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Virtual ESP32 Nodes</span>
            <Radio className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{devices.length} / 8</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>{devices.length - loraCount} WiFi</span>
            {loraCount > 0 && (
              <span className="text-amber-400 font-bold">• {loraCount} on LoRa Fallback</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Split View: Tactical Map + Real-time Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tactical Leaflet Map (7 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col min-h-[520px]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-sm text-white">Kathmandu Valley Live Geospatial Operations</h2>
              <p className="text-xs text-slate-400">
                🔵 ESP32 Nodes (solid: WiFi, dashed: LoRa) • 🟢 Safe • 🔴 Unsafe • 🏠 Shelters • 🆘 Distress
              </p>
            </div>
          </div>
          <div className="flex-1 w-full h-full min-h-[460px]">
            <LiveMap
              devices={devices}
              disasters={disasters}
              users={users}
              shelters={shelters}
              sosList={sosList}
            />
          </div>
        </div>

        {/* Live Stream & Triage Feed (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active SOS Triage Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                <LifeBuoy className="w-4 h-4" /> Priority SOS Queue
              </span>
              <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-mono">
                {sosList.length} Active
              </span>
            </div>

            {sosList.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No active distress beacons. Standing by.
              </div>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto">
                {sosList.map((sos) => (
                  <div
                    key={sos.id}
                    className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {sos.user?.name || 'Citizen'} ({sos.numberOfPeople} people)
                      </span>
                      <span className="text-[10px] font-bold text-red-400 uppercase">
                        {sos.status}
                      </span>
                    </div>
                    <p className="text-xs text-red-200 line-clamp-2">{sos.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Tel: {sos.contactNumber}</span>
                      <span className="text-amber-400">Med: {sos.medicalEmergency}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live IoT Sensor Telemetry Stream */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-4 h-4" /> IoT Sensor Telemetry Feed
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live (3s)
              </span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto font-mono text-xs">
              {latestReadings.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Awaiting sensor telemetry packets...
                </div>
              ) : (
                latestReadings.map((r, idx) => (
                  <div
                    key={r.id || idx}
                    className="p-2 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-200">
                        {r.deviceId?.substring(0, 13) || 'Node'}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">
                        [{r.transport}]
                      </span>
                    </div>
                    <div className="text-right text-[11px]">
                      <span className="text-blue-400 mr-2">W:{r.waterLevel}cm</span>
                      <span className="text-amber-400 mr-2">R:{r.rainfall}mm</span>
                      <span className="text-slate-300">A:{r.acceleration}g</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
