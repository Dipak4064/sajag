'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, Navigation, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { api } from '@/lib/api';

export default function SheltersPage() {
  const [shelters, setShelters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/shelters/nearest?lat=27.6895&lng=85.3021')
      .then((res) => {
        if (res.data.success) {
          setShelters(res.data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto border-x border-slate-800">
      <header className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 sticky top-0 z-10 backdrop-blur">
        <Link href="/citizen" className="text-slate-400 hover:text-white flex items-center gap-1 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <span className="font-bold text-slate-200 text-sm">EMERGENCY SHELTERS</span>
      </header>

      <div className="p-4 flex-1 space-y-3 overflow-y-auto">
        <p className="text-xs text-slate-400">
          Designated safe open spaces and evacuation havens across Kathmandu Valley verified by NDMA.
        </p>

        {loading ? (
          <div className="text-center py-10 text-xs text-slate-500">Loading verified shelters...</div>
        ) : shelters.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">No active shelters located.</div>
        ) : (
          shelters.map((s) => (
            <div key={s.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">{s.name}</h3>
                  {s.nameNe && <p className="text-xs text-slate-400 font-serif">{s.nameNe}</p>}
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                  {s.availableBeds} beds
                </span>
              </div>

              <p className="text-xs text-slate-400">{s.address}</p>

              {/* Facility Badges */}
              <div className="flex flex-wrap gap-1 text-[10px]">
                {s.hasMedicalFacility && (
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Medical Clinic
                  </span>
                )}
                {s.hasBackupPower && (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded flex items-center gap-0.5">
                    <Zap className="w-3 h-3" /> Backup Power
                  </span>
                )}
                {s.hasFoodWater && (
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Water & Rations
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-medium">
                <span className="text-blue-400 flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> {(s.distanceMeters / 1000).toFixed(1)} km away
                </span>
                <span className="text-slate-400">Total Capacity: {s.totalCapacity}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
