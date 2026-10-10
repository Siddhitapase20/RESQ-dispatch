import React from 'react';
import { FloodReport } from '../types/report';
import { Shield, Navigation, AlertTriangle } from 'lucide-react';

interface Props {
  reports: FloodReport[];
}

export const ResponderView: React.FC<Props> = ({ reports }) => {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Field Rescue Responder View
            </h2>
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Unit: Boat Alpha-1
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Phases 5 & 6 will power automated matching, FCM push notifications, and lifecycle step progression.
          </p>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
          <Shield className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Assigned Missions ({reports.length > 0 ? 1 : 0})
        </h3>

        {reports.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
            No active dispatch mission assigned yet. Standing by at base.
          </div>
        ) : (
          <div className="border border-sky-200 bg-sky-50/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-sky-900">
                Mission Target: {reports[0].location.manualAddress || 'Coordinated Sector'}
              </span>
              <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                Status: Reported (Awaiting Dispatcher Match)
              </span>
            </div>

            <p className="text-xs text-slate-700 font-medium">
              "{reports[0].text}"
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-sky-100">
              <button
                disabled
                className="px-3 py-1.5 bg-sky-600/50 text-white rounded-lg text-xs font-semibold cursor-not-allowed flex items-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate (Phase 5)</span>
              </button>
              <button
                disabled
                className="px-3 py-1.5 bg-slate-200 text-slate-500 rounded-lg text-xs font-semibold cursor-not-allowed flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Road Blocked (Phase 6)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
