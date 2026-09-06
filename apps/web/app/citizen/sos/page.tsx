'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, CheckCircle2, Clock, AlertTriangle, Users, HeartPulse } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function SOSPage() {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isTriggered, setIsTriggered] = useState(false);
  const [sosRecord, setSosRecord] = useState<any>(null);
  const [description, setDescription] = useState('Immediate flood water rising inside ground floor.');
  const [numberOfPeople, setNumberOfPeople] = useState(3);
  const [medicalEmergency, setMedicalEmergency] = useState<'NONE' | 'MINOR' | 'SEVERE' | 'CRITICAL'>('SEVERE');
  const [contactNumber, setContactNumber] = useState('+9779800000001');

  // 3-second abort countdown
  const startCountdown = () => {
    setCountdown(3);
  };

  const cancelCountdown = () => {
    setCountdown(null);
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0) {
      // Countdown finished, fire SOS request
      setCountdown(null);
      triggerSOS();
    }
  }, [countdown]);

  const triggerSOS = async () => {
    try {
      const res = await api.post('/sos', {
        latitude: 27.6895,
        longitude: 85.3021,
        addressText: 'Near Balkhu Bridge, Kathmandu',
        description,
        numberOfPeople,
        medicalEmergency,
        contactNumber
      });

      if (res.data.success) {
        setSosRecord(res.data.data);
        setIsTriggered(true);
      }
    } catch (err: any) {
      alert('Failed to send SOS: ' + err.message);
    }
  };

  // Real-time listener for SOS updates from Authority Command Center
  useEffect(() => {
    const socket = getSocket();
    socket.on('sos:update', (updated: any) => {
      if (sosRecord && updated.id === sosRecord.id) {
        setSosRecord(updated);
      }
    });

    return () => {
      socket.off('sos:update');
    };
  }, [sosRecord]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto border-x border-slate-800">
      {/* Header */}
      <header className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 sticky top-0 z-10 backdrop-blur">
        <Link href="/citizen" className="text-slate-400 hover:text-white flex items-center gap-1 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <span className="font-bold text-red-500 text-sm">EMERGENCY SOS TRIAGE</span>
      </header>

      <div className="p-5 flex-1 flex flex-col justify-center space-y-6">
        {!isTriggered ? (
          <>
            {/* Countdown Overlay */}
            {countdown !== null ? (
              <div className="p-8 bg-red-950 border-2 border-red-500 rounded-3xl text-center flex flex-col items-center animate-pulse">
                <span className="text-xs uppercase font-bold text-red-300 mb-2">Broadcasting Distress in</span>
                <span className="text-7xl font-black text-white mb-4">{countdown}</span>
                <p className="text-xs text-red-200 mb-6">Hold tight or cancel if pressed by mistake</p>
                <button
                  onClick={cancelCountdown}
                  className="w-full py-3 bg-slate-900 border border-slate-700 text-white font-bold rounded-xl text-sm hover:bg-slate-800"
                >
                  CANCEL ALARM ✕
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-black text-white mb-1">Request Rescue Team</h2>
                  <p className="text-xs text-slate-400">
                    Your GPS coordinates (27.6895, 85.3021) will be shared instantly with Armed Police Force and Nepal Army.
                  </p>
                </div>

                {/* Form Inputs */}
                <div className="space-y-4 bg-slate-900/80 p-4 border border-slate-800 rounded-xl">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-400" /> People trapped / needing rescue:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={numberOfPeople}
                      onChange={(e) => setNumberOfPeople(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                      <HeartPulse className="w-3.5 h-3.5 text-red-400" /> Medical Urgency:
                    </label>
                    <select
                      value={medicalEmergency}
                      onChange={(e) => setMedicalEmergency(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                    >
                      <option value="NONE">None - Safe from physical injury</option>
                      <option value="MINOR">Minor - First aid needed</option>
                      <option value="SEVERE">Severe - Bleeding / Fracture</option>
                      <option value="CRITICAL">Critical - Life-threatening / Unconscious</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">
                      Describe your situation:
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                    />
                  </div>
                </div>

                {/* Big Red Activate Button */}
                <button
                  onClick={startCountdown}
                  className="w-full py-5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 rounded-2xl shadow-xl shadow-red-950/80 text-white font-black text-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <ShieldAlert className="w-7 h-7" />
                  SEND RESCUE SOS NOW
                </button>
              </div>
            )}
          </>
        ) : (
          /* Active SOS Tracking State Machine Screen */
          <div className="space-y-6 text-center">
            <div className="p-4 bg-red-950/80 border border-red-500/50 rounded-2xl">
              <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white">SOS DISTRESS BROADCASTED</h3>
              <p className="text-xs text-red-200 mt-1">
                Your beacon is actively pinging the Municipal Command Center. Stay calm and follow safety instructions.
              </p>
            </div>

            {/* Status Steps */}
            <div className="space-y-3 text-left bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">1. Distress Signal Received</div>
                  <div className="text-xs text-slate-400">Logged in Municipal Command Center</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {sosRecord?.status === 'PENDING' ? (
                  <Clock className="w-5 h-5 text-yellow-400 shrink-0 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                <div>
                  <div className="text-sm font-bold text-white">2. Authority Triage</div>
                  <div className="text-xs text-slate-400">
                    Status: <span className="font-mono text-yellow-400">{sosRecord?.status}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {sosRecord?.assignedTeam ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-700 shrink-0" />
                )}
                <div>
                  <div className="text-sm font-bold text-white">3. Rescue Team Dispatched</div>
                  <div className="text-xs text-slate-400">
                    {sosRecord?.assignedTeam
                      ? `Team: ${sosRecord.assignedTeam.name} (${sosRecord.assignedTeam.leadOfficerName})`
                      : 'Matching nearest APF / Army rescue team...'}
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/citizen"
              className="inline-block py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-xs"
            >
              Return to Citizen Portal
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
