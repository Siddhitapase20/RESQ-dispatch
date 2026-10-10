import React from 'react';
import { FloodReport } from '../types/report';
import { AlertCircle, LifeBuoy, MapPin, Sparkles, Clock, RefreshCw } from 'lucide-react';

interface Props {
  reports: FloodReport[];
  onRefresh: () => void;
}

export const DispatchDashboard: React.FC<Props> = ({ reports, onRefresh }) => {
  const syncedReports = reports.filter((r) => r.synced);
  const queuedReports = reports.filter((r) => !r.synced);

  return (
    <div className="space-y-6">
      {/* Top Bar / Statistics */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Emergency Dispatch Central
            </h2>
            <span className="text-[11px] font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
              Phase 1 Preview
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time intake stream. Gemini AI extraction & clustering (Phases 2 & 3) will automatically categorize and cluster these reports.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Intake
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {reports.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across all channels</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            Cloud Synced
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {syncedReports.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ready for AI triage</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
            Queued Offline
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {queuedReports.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Pending sync</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider">
            Active Incidents
          </div>
          <div className="text-2xl font-black text-sky-700 mt-1">
            {reports.length > 0 ? 1 : 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Clusters formed</div>
        </div>
      </div>

      {/* Incoming Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-sky-600" />
            <span>Incoming Raw SOS Feed</span>
          </h3>
          <span className="text-xs text-slate-500">
            {reports.length} incident reports captured
          </span>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No flood reports yet.</p>
            <p className="text-[11px] text-slate-400">
              Switch role to <strong>Citizen / Field (/report)</strong> to create an SOS report.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {report.id}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                      Need: {report.preliminaryNeed || 'general'}
                    </span>
                    {report.synced ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Synced
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Offline Queue
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                    <span className="flex items-center gap-1" title="Client creation time">
                      <Clock className="w-3 h-3" />
                      <span>Captured: {new Date(report.clientCreatedAt).toLocaleTimeString()}</span>
                    </span>
                    {report.receivedAt && (
                      <span className="text-emerald-600 font-semibold" title="Firestore receivedAt server timestamp">
                        &bull; Firestore: {new Date(report.receivedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {report.text || 'No text note provided.'}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-200/70">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" />
                    <span>
                      {report.location.manualAddress || `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}`}
                    </span>
                  </div>
                  {report.contactPhone && (
                    <span>Phone: {report.contactPhone}</span>
                  )}
                  {report.photoBase64 && (
                    <span className="text-sky-600 font-semibold">✓ Photo attached</span>
                  )}
                  {report.audioBase64 && (
                    <span className="text-rose-600 font-semibold">
                      ✓ Audio voice message attached ({report.audioDurationSec || 0}s)
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Phase 2 Gemini extraction ready
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
