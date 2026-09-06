'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle2, Camera } from 'lucide-react';
import { api } from '@/lib/api';

export default function CitizenReportPage() {
  const [disasterType, setDisasterType] = useState('FLOOD');
  const [description, setDescription] = useState('');
  const [addressText, setAddressText] = useState('Balkhu Riverbank Corridor, Kathmandu');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    try {
      await api.post('/reports', {
        disasterType,
        latitude: 27.6895,
        longitude: 85.3021,
        addressText,
        description,
        mediaUrls: []
      });
      setIsSubmitted(true);
    } catch (err: any) {
      alert('Error submitting report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto border-x border-slate-800">
      <header className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 sticky top-0 z-10 backdrop-blur">
        <Link href="/citizen" className="text-slate-400 hover:text-white flex items-center gap-1 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <span className="font-bold text-slate-200 text-sm">CITIZEN INCIDENT REPORT</span>
      </header>

      <div className="p-5 flex-1">
        {isSubmitted ? (
          <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 my-auto">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Report Submitted Successfully</h3>
            <p className="text-xs text-slate-400">
              Thank you. Your ground report has been forwarded to municipal emergency dispatchers for verification.
            </p>
            <Link
              href="/citizen"
              className="inline-block py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-xs"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Hazard Type:</label>
              <select
                value={disasterType}
                onChange={(e) => setDisasterType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-red-500 outline-none"
              >
                <option value="FLOOD">🌊 Flood / River Water Overflow</option>
                <option value="LANDSLIDE">⛰️ Landslide / Mudflow</option>
                <option value="EARTHQUAKE">🌎 Earthquake / Structural Crack</option>
                <option value="ROAD_BLOCKED">🚧 Road Blocked / Inaccessible</option>
                <option value="FOREST_FIRE">🔥 Forest Fire / Urban Fire</option>
                <option value="OTHER">⚠️ Other Hazard</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Location / Landmark:</label>
              <input
                type="text"
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Observations & Details:</label>
              <textarea
                rows={4}
                required
                placeholder="E.g., Bagmati river is overflowing above retaining wall. Road is submerged under 2 feet of water."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-red-500 outline-none"
              />
            </div>

            <div className="p-4 bg-slate-900/60 border border-dashed border-slate-700 rounded-xl text-center">
              <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <div className="text-xs text-slate-400">Photo / Evidence attachment (Simulated in demo)</div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Submitting...' : 'Submit Incident Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
