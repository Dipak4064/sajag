'use client';

import { useState, useEffect } from 'react';
import { BellRing, CheckCircle, Clock, PhoneCall, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function AlertsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts');
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const socket = getSocket();
    socket.on('alert:new', (event: any) => {
      setEvents((prev) => [event, ...prev]);
    });

    socket.on('alert:update', () => {
      fetchAlerts();
    });

    return () => {
      socket.off('alert:new');
      socket.off('alert:update');
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <BellRing className="w-5 h-5 text-red-500" />
          Alert State Machine & Automated Twilio IVR Dispatches
        </h1>
        <p className="text-xs text-slate-400">
          State transition pipeline: <code>DETECTED &rarr; ANALYZING &rarr; CONFIRMED &rarr; NOTIFYING &rarr; WAITING_RESPONSE &rarr; SAFE / UNSAFE</code>
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Querying alert dispatch logs...</div>
      ) : events.length === 0 ? (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-500">
          No disaster hazard events recorded. Use the "Simulate Disaster" button to trigger an emergency curve.
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((evt) => (
            <div key={evt.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      evt.severity === 'CRITICAL'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse'
                        : 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                    }`}
                  >
                    {evt.severity} {evt.type}
                  </span>
                  <span className="text-sm font-bold text-white">{evt.title}</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Score: <strong className="text-white">{evt.riskScore} / 100</strong> • Status: <span className="text-emerald-400">{evt.status}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300">{evt.description}</p>

              {/* Recipient Calls List */}
              {evt.alerts && evt.alerts.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                    Automated Voice Call Triage ({evt.alerts.length} Citizens in 5km Zone)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {evt.alerts.map((al: any) => {
                      const isSafe = al.status === 'SAFE';
                      const isUnsafe = al.status === 'UNSAFE';

                      return (
                        <div
                          key={al.id}
                          className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-white">{al.user?.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{al.user?.phone}</div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isSafe
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : isUnsafe
                                ? 'bg-red-500/10 text-red-400 border-red-500/30 font-black'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {al.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
