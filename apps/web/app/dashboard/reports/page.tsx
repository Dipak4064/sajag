'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, Check, X, MapPin } from 'lucide-react';
import { api } from '@/lib/api';

export default function ReportsReviewPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleVerify = async (id: string, status: string) => {
    try {
      await api.patch(`/reports/${id}/verify`, { status });
      fetchReports();
    } catch (err: any) {
      alert('Failed to update report: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-amber-400" />
          Citizen Incident Field Reports Verification
        </h1>
        <p className="text-xs text-slate-400">
          Crowdsourced disaster observations submitted by residents across Kathmandu. Verify to confirm ground truth.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Loading incident reports...</div>
      ) : reports.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-500">
          No citizen field reports submitted yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((rep) => {
            const isVerified = rep.status === 'VERIFIED';
            const isRejected = rep.status === 'REJECTED';

            return (
              <div
                key={rep.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {rep.disasterType}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      isVerified
                        ? 'text-emerald-400'
                        : isRejected
                        ? 'text-red-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {rep.status}
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">{rep.description}</p>

                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{rep.addressText || `${rep.latitude.toFixed(4)}, ${rep.longitude.toFixed(4)}`}</span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    By: {rep.user?.name || 'Citizen'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerify(rep.id, 'VERIFIED')}
                      className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded text-xs font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Verify
                    </button>
                    <button
                      onClick={() => handleVerify(rep.id, 'REJECTED')}
                      className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 rounded text-xs font-semibold flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
