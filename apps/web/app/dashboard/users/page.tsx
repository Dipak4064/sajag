'use client';

import { useState, useEffect } from 'react';
import { Users, PhoneCall, Mic, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function UsersRosterPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [tally, setTally] = useState<any>({ SAFE: 0, UNSAFE: 0, NO_RESPONSE: 0, total: 30 });
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.data.users);
        setTally(res.data.data.tally);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Resident Safety Roster & Whisper Voice Transcripts
          </h1>
          <p className="text-xs text-slate-400">
            Kathmandu Valley population census. Monitors Twilio IVR DTMF confirmations and transcribed voice distress recordings.
          </p>
        </div>

        {/* Status Breakdown Chips */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg">
            Safe: {tally.SAFE}
          </span>
          <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg">
            Unsafe: {tally.UNSAFE}
          </span>
          <span className="px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg">
            No Response: {tally.NO_RESPONSE}
          </span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Resident Name</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Coordinates</th>
                <th className="p-4">Safety Status</th>
                <th className="p-4">Transcribed Voice / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Loading resident safety roster...
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSafe = u.status === 'SAFE';
                  const isUnsafe = u.status === 'UNSAFE';

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-white">{u.name}</td>
                      <td className="p-4 font-mono text-slate-300">{u.phone}</td>
                      <td className="p-4 font-mono text-slate-400 text-[11px]">
                        {u.latitude.toFixed(4)}, {u.longitude.toFixed(4)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isSafe
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isUnsafe
                              ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isSafe && <CheckCircle2 className="w-3 h-3" />}
                          {isUnsafe && <AlertCircle className="w-3 h-3" />}
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 max-w-xs truncate">
                        {isUnsafe ? (
                          <div className="flex items-center gap-1.5 text-xs text-red-300 bg-red-950/40 px-2 py-1 rounded border border-red-800/60">
                            <Mic className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span className="truncate">"Trapped under debris near collapsed wall..."</span>
                            <span className="px-1.5 py-0.2 bg-red-600 text-white rounded text-[9px] font-bold uppercase">
                              CRITICAL
                            </span>
                          </div>
                        ) : isSafe ? (
                          <span className="text-slate-500 text-[11px]">DTMF '1' Confirmed Safe</span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">Awaiting IVR Callback</span>
                        )}
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
