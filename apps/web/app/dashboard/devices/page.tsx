'use client';

import { useState, useEffect } from 'react';
import { Radio, Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      const res = await api.get('/devices');
      if (res.data.success) {
        setDevices(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();

    const socket = getSocket();

    socket.on('reading:new', (reading: any) => {
      setDevices((prev) =>
        prev.map((d) => (d.id === reading.deviceId ? { ...d, readings: [reading] } : d))
      );
    });

    socket.on('device:status', ({ deviceId, status, transport }) => {
      setDevices((prev) =>
        prev.map((d) => (d.deviceId === deviceId ? { ...d, status, transport } : d))
      );
    });

    return () => {
      socket.off('reading:new');
      socket.off('device:status');
    };
  }, []);

  const toggleDeviceTransport = async (device: any) => {
    const newMode = device.transport === 'LORA_SIM' ? 'NORMAL' : 'LORA_FALLBACK';
    setTogglingId(device.deviceId);
    try {
      await api.post('/sim/network-mode', {
        mode: newMode,
        deviceId: device.deviceId
      });
      // Optimistic update
      setDevices((prev) =>
        prev.map((d) =>
          d.deviceId === device.deviceId
            ? { ...d, transport: newMode === 'LORA_FALLBACK' ? 'LORA_SIM' : 'MQTT' }
            : d
        )
      );
    } catch (err: any) {
      alert('Failed to toggle network mode: ' + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-400" />
            Virtual ESP32 Telemetry & LoRa Fallback Matrix
          </h1>
          <p className="text-xs text-slate-400">
            Kathmandu Valley Sensor Fleet. Toggle individual stations to simulate WiFi link failure & automatic LoRa uplink failover.
          </p>
        </div>

        <button
          onClick={fetchDevices}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Fleet
        </button>
      </div>

      {/* Network Resilience Explanation Banner */}
      <div className="p-4 bg-slate-900/90 border border-amber-500/30 rounded-2xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong>Hackathon Live Demonstration:</strong> When a flood or earthquake damages cellular/WiFi towers in Kathmandu,
          the virtual sensor node automatically routes telemetry through the secondary <strong>Firebase Realtime Database (simulating LoRa gateway uplink)</strong>.
          Click the <span className="text-amber-400 font-bold underline">"Simulate Outage"</span> toggle below to watch live packets switch transports seamlessly.
        </div>
      </div>

      {/* Devices Grid / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Station ID & Name</th>
                <th className="p-4">Coordinates</th>
                <th className="p-4">Active Transport</th>
                <th className="p-4">Water Level</th>
                <th className="p-4">Rainfall</th>
                <th className="p-4">Acceleration</th>
                <th className="p-4">Soil Moisture</th>
                <th className="p-4 text-right">Failover Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                    Scanning sensor telemetry channels...
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                    No sensor nodes found. Please run seed script.
                  </td>
                </tr>
              ) : (
                devices.map((dev) => {
                  const isLoRa = dev.transport === 'LORA_SIM';
                  const r = dev.readings?.[0];

                  return (
                    <tr key={dev.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & ID */}
                      <td className="p-4 font-sans">
                        <div className="font-bold text-white text-sm">{dev.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{dev.deviceId}</div>
                      </td>

                      {/* Coordinates */}
                      <td className="p-4 text-slate-300 text-[11px]">
                        {dev.latitude.toFixed(4)}, {dev.longitude.toFixed(4)}
                      </td>

                      {/* Transport Badge */}
                      <td className="p-4 font-sans">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            isLoRa
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {isLoRa ? (
                            <>
                              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              <span>LoRa Fallback 📡</span>
                            </>
                          ) : (
                            <>
                              <Wifi className="w-3.5 h-3.5 text-blue-400" />
                              <span>WiFi / MQTT 📶</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Water Level */}
                      <td className="p-4">
                        <span
                          className={
                            r?.waterLevel >= 80
                              ? 'text-red-400 font-bold'
                              : r?.waterLevel >= 50
                              ? 'text-yellow-400'
                              : 'text-slate-300'
                          }
                        >
                          {r?.waterLevel ? `${r.waterLevel} cm` : '--'}
                        </span>
                      </td>

                      {/* Rainfall */}
                      <td className="p-4">
                        <span
                          className={
                            r?.rainfall >= 50
                              ? 'text-red-400 font-bold'
                              : r?.rainfall >= 20
                              ? 'text-yellow-400'
                              : 'text-slate-300'
                          }
                        >
                          {r?.rainfall ? `${r.rainfall} mm` : '--'}
                        </span>
                      </td>

                      {/* Acceleration */}
                      <td className="p-4">
                        <span
                          className={
                            r?.acceleration >= 1.0
                              ? 'text-red-400 font-bold'
                              : 'text-slate-300'
                          }
                        >
                          {r?.acceleration ? `${r.acceleration} g` : '--'}
                        </span>
                      </td>

                      {/* Soil Moisture */}
                      <td className="p-4">
                        <span
                          className={
                            r?.soilMoisture >= 80
                              ? 'text-amber-400 font-bold'
                              : 'text-slate-300'
                          }
                        >
                          {r?.soilMoisture ? `${r.soilMoisture}%` : '--'}
                        </span>
                      </td>

                      {/* Failover Button */}
                      <td className="p-4 text-right font-sans">
                        <button
                          disabled={togglingId === dev.deviceId}
                          onClick={() => toggleDeviceTransport(dev)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            isLoRa
                              ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30'
                              : 'bg-amber-600/20 border-amber-500/40 text-amber-300 hover:bg-amber-600/30'
                          }`}
                        >
                          {isLoRa ? 'Restore WiFi' : 'Simulate Outage ⚡'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
