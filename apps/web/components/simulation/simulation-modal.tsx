'use client';

import { useState } from 'react';
import { Play, RotateCcw, Radio, Sparkles, X } from 'lucide-react';
import { api } from '@/lib/api';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SimulationModal({ isOpen, onClose, onSuccess }: SimulationModalProps) {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const runScenario = async (scenario: 'FLOOD' | 'EARTHQUAKE' | 'LANDSLIDE' | 'NORMAL') => {
    setLoading(true);
    setStatusMsg(`Injecting ${scenario} scenario physics...`);
    try {
      const res = await api.post('/sim/scenario', {
        scenario,
        targetDeviceId: 'ESP32-KTM-001',
        durationSeconds: 30
      });
      if (res.data.success) {
        setStatusMsg(`Scenario ${scenario} active for 30s! Watch live readings & alerts.`);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setStatusMsg(`Simulation error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleNetworkMode = async (mode: 'NORMAL' | 'LORA_FALLBACK') => {
    setLoading(true);
    setStatusMsg(`Switching network transport to ${mode}...`);
    try {
      const res = await api.post('/sim/network-mode', { mode });
      if (res.data.success) {
        setStatusMsg(
          mode === 'LORA_FALLBACK'
            ? 'WiFi Outage Simulated! Sensors failed over to Firebase LoRa Uplink 📡'
            : 'Primary WiFi / MQTT link restored 📶'
        );
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setStatusMsg(`Network mode error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-white text-base">
              Hackathon 1-Click Disaster & Network Simulator
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-xs text-slate-300 leading-relaxed">
            Judge Demo Controls: Trigger instant physical curves in the virtual ESP32 simulator and watch the entire
            pipeline react in real time: <strong>Sense &rarr; Decide &rarr; Alert &rarr; Call &rarr; Rescue</strong>.
          </p>

          {/* Scenario Trigger Buttons */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              1. Disaster Scenarios (Kathmandu Valley)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                disabled={loading}
                onClick={() => runScenario('FLOOD')}
                className="p-3.5 bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 rounded-xl text-left transition-all"
              >
                <div className="text-lg mb-1">🌊</div>
                <div className="text-sm font-bold text-blue-300">Bagmati Flood</div>
                <div className="text-[11px] text-blue-200/70">Water 22&rarr;96cm, Rain 85mm</div>
              </button>

              <button
                disabled={loading}
                onClick={() => runScenario('EARTHQUAKE')}
                className="p-3.5 bg-red-600/20 border border-red-500/40 hover:bg-red-600/30 rounded-xl text-left transition-all"
              >
                <div className="text-lg mb-1">🌎</div>
                <div className="text-sm font-bold text-red-300">M6.5 Quake</div>
                <div className="text-[11px] text-red-200/70">Seismic shock 2.4g shockwave</div>
              </button>

              <button
                disabled={loading}
                onClick={() => runScenario('LANDSLIDE')}
                className="p-3.5 bg-amber-600/20 border border-amber-500/40 hover:bg-amber-600/30 rounded-xl text-left transition-all"
              >
                <div className="text-lg mb-1">⛰️</div>
                <div className="text-sm font-bold text-amber-300">Slope Slide</div>
                <div className="text-[11px] text-amber-200/70">Soil saturation 92%</div>
              </button>
            </div>
          </div>

          {/* LoRa Fallback Outage Simulation */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              2. Network Resilience (LoRa Fallback Demonstration)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={loading}
                onClick={() => toggleNetworkMode('LORA_FALLBACK')}
                className="p-3 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                SIMULATE WIFI OUTAGE
              </button>

              <button
                disabled={loading}
                onClick={() => toggleNetworkMode('NORMAL')}
                className="p-3 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                RESTORE WIFI (MQTT)
              </button>
            </div>
          </div>

          {/* Reset button */}
          <button
            disabled={loading}
            onClick={() => runScenario('NORMAL')}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All Sensors to Baseline
          </button>

          {/* Status feedback */}
          {statusMsg && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-300 text-center">
              {statusMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
