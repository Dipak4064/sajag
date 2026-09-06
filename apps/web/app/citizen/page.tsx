'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, ShieldAlert, Home, FileText, Phone, Navigation, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function CitizenPage() {
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [nearestShelter, setNearestShelter] = useState<any>(null);
  const [riskScore, setRiskScore] = useState(24); // Baseline safe
  const [locationName, setLocationName] = useState('Balkhu, Kathmandu (27.6895, 85.3021)');

  useEffect(() => {
    // 1. Fetch active alerts
    api.get('/alerts/active')
      .then((res) => {
        if (res.data.success && res.data.data.length > 0) {
          setActiveAlerts(res.data.data);
          setRiskScore(res.data.data[0].riskScore);
        }
      })
      .catch(() => {});

    // 2. Fetch nearest shelter
    api.get('/shelters/nearest?lat=27.6895&lng=85.3021')
      .then((res) => {
        if (res.data.success && res.data.data.length > 0) {
          setNearestShelter(res.data.data[0]);
        }
      })
      .catch(() => {});

    // 3. Listen to real-time alerts
    const socket = getSocket();
    socket.on('alert:new', (event: any) => {
      setActiveAlerts((prev) => [event, ...prev]);
      setRiskScore(event.riskScore);
    });

    return () => {
      socket.off('alert:new');
    };
  }, []);

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (score >= 60) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    if (score >= 30) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 80) return 'CRITICAL HAZARD';
    if (score >= 60) return 'HIGH RISK';
    if (score >= 30) return 'MODERATE ADVISORY';
    return 'NORMAL / SAFE';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto border-x border-slate-800">
      {/* Citizen Header */}
      <header className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 sticky top-0 z-20 backdrop-blur">
        <div>
          <h1 className="font-extrabold text-lg text-white flex items-center gap-1.5">
            <span className="text-red-500 font-serif">सजग</span> Citizen
          </h1>
          <p className="text-xs text-slate-400 truncate max-w-[220px]">📍 {locationName}</p>
        </div>
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded border border-slate-700"
        >
          Exit
        </Link>
      </header>

      <div className="p-4 flex-1 space-y-4 overflow-y-auto">
        {/* Active Emergency Alert Banner if any */}
        {activeAlerts.length > 0 && (
          <div className="p-4 bg-red-950/90 border border-red-600 rounded-xl animate-pulse">
            <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
              <AlertCircle className="w-5 h-5" />
              <span>{activeAlerts[0].title}</span>
            </div>
            <p className="text-xs text-red-200 mb-3">{activeAlerts[0].description}</p>
            <div className="flex items-center justify-between text-xs text-red-300 font-medium">
              <span>Severity: {activeAlerts[0].severity}</span>
              <span className="underline">Radius: 5 km</span>
            </div>
          </div>
        )}

        {/* Local Risk Gauge Card */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Community Hazard Index
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getRiskColor(riskScore)}`}>
              {getRiskLabel(riskScore)}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-4xl font-extrabold text-white">{riskScore}</span>
            <span className="text-sm text-slate-400">/ 100</span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                riskScore >= 60 ? 'bg-red-500' : riskScore >= 30 ? 'bg-yellow-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </div>

        {/* Primary SOS Distress Button */}
        <Link
          href="/citizen/sos"
          className="group block relative p-6 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 rounded-2xl shadow-xl shadow-red-950/60 text-center transition-all duration-200 active:scale-95"
        >
          <div className="flex flex-col items-center justify-center">
            <div className="p-3 bg-white/10 rounded-full mb-2 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-wide">EMERGENCY SOS 🆘</span>
            <span className="text-xs text-red-100 font-medium mt-1">
              Tap to request immediate military & APF rescue
            </span>
          </div>
        </Link>

        {/* Nearest Safe Shelter Card */}
        {nearestShelter && (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-blue-400" /> Nearest Safe Haven
              </span>
              <span className="text-xs font-bold text-emerald-400">
                {nearestShelter.availableBeds} beds available
              </span>
            </div>
            <h4 className="font-bold text-white text-sm mb-1">{nearestShelter.name}</h4>
            <p className="text-xs text-slate-400 mb-3">{nearestShelter.address}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                <Navigation className="w-3 h-3" /> {(nearestShelter.distanceMeters / 1000).toFixed(1)} km away
              </span>
              <Link
                href="/citizen/shelters"
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1 underline"
              >
                View all shelters <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Quick Citizen Incident Report */}
        <Link
          href="/citizen/report"
          className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Report Disaster Incident</div>
              <div className="text-xs text-slate-400">Submit photo & GPS of floods, landslides, or blockages</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>

      {/* Emergency Hotlines Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80 text-xs text-slate-400 flex justify-around">
        <span className="flex items-center gap-1">
          <Phone className="w-3 h-3 text-red-400" /> Police: 100
        </span>
        <span className="flex items-center gap-1">
          <Phone className="w-3 h-3 text-blue-400" /> Red Cross: 1130
        </span>
        <span className="flex items-center gap-1">
          <Phone className="w-3 h-3 text-emerald-400" /> Ambulance: 102
        </span>
      </div>
    </div>
  );
}
