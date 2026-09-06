'use client';

import { useState, useEffect } from 'react';
import { LifeBuoy, Users, HeartPulse, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function SOSTriagePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const fetchSOS = async () => {
    try {
      const res = await api.get('/sos/active');
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSOS();

    const socket = getSocket();
    socket.on('sos:new', (newSOS: any) => {
      setRequests((prev) => [newSOS, ...prev]);
    });

    socket.on('sos:update', (updated: any) => {
      setRequests((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
      );
    });

    return () => {
      socket.off('sos:new');
      socket.off('sos:update');
    };
  }, []);

  const handleAssignTeam = async (sosId: string, teamId: string) => {
    setDispatchingId(sosId);
    try {
      await api.post(`/sos/${sosId}/assign`, { teamId });
      fetchSOS();
    } catch (err: any) {
      alert('Failed to dispatch team: ' + err.message);
    } finally {
      setDispatchingId(null);
    }
  };

  const handleResolve = async (sosId: string) => {
    try {
      await api.patch(`/sos/${sosId}/status`, { status: 'RESOLVED' });
      fetchSOS();
    } catch (err: any) {
      alert('Failed to resolve SOS: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-rose-500" />
            Live SOS Emergency Triage & Rescue Dispatch
          </h1>
          <p className="text-xs text-slate-400">
            Real-time distress beacons received from citizens with automated APF and Nepal Army proximity matching.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Scanning SOS triage queue...</div>
      ) : requests.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-500">
          No pending SOS distress requests. Queue is completely clear.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((sos) => (
            <div
              key={sos.id}
              className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl space-y-4 shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base">
                    {sos.user?.name || 'Emergency Victim'}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono">
                    📍 ({sos.latitude.toFixed(4)}, {sos.longitude.toFixed(4)}) • {sos.addressText || 'Kathmandu'}
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 uppercase">
                  {sos.status}
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                <p className="text-slate-200">{sos.description}</p>
                <div className="flex flex-wrap gap-4 text-slate-400 pt-1">
                  <span className="flex items-center gap-1 font-semibold text-white">
                    <Users className="w-3.5 h-3.5 text-blue-400" /> {sos.numberOfPeople} Trapped
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-amber-400">
                    <HeartPulse className="w-3.5 h-3.5" /> Medical: {sos.medicalEmergency}
                  </span>
                  <span className="font-mono">Tel: {sos.contactNumber}</span>
                </div>
              </div>

              {/* Assignment or Action */}
              {sos.assignedTeam ? (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-emerald-300">
                      Assigned: {sos.assignedTeam.name}
                    </div>
                    <div className="text-[11px] text-emerald-400/80">
                      Officer: {sos.assignedTeam.leadOfficerName} ({sos.assignedTeam.teamType})
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolve(sos.id)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                  >
                    Mark Rescued ✅
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Recommended Nearby Rescue Teams:
                  </span>
                  <div className="space-y-1.5">
                    {sos.nearbyTeams?.map((team: any) => (
                      <div
                        key={team.id}
                        className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-200">{team.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {(team.distanceMeters / 1000).toFixed(1)} km away • Lead: {team.leadOfficerName}
                          </div>
                        </div>
                        <button
                          disabled={dispatchingId === sos.id}
                          onClick={() => handleAssignTeam(sos.id, team.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-md text-xs flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Dispatch
                        </button>
                      </div>
                    ))}
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
