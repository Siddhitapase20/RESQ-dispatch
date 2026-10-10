import React from 'react';
import { UserRole } from '../types/report';
import { QueueStatus, setSimulatedOffline } from '../services/offlineQueue';
import { StatusBadge } from './StatusBadge';
import { AlertTriangle, Wifi, WifiOff, Users, Radio, LifeBuoy } from 'lucide-react';

interface Props {
  role: UserRole;
  setRole: (role: UserRole) => void;
  queueStatus: QueueStatus;
  onFlushQueue: () => void;
}

export const Header: React.FC<Props> = ({ role, setRole, queueStatus, onFlushQueue }) => {
  const isOffline = queueStatus.isSimulatedOffline;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Synthetic Data Disclaimer Banner */}
      <div className="bg-amber-500 text-slate-900 text-xs font-semibold px-4 py-1 text-center flex items-center justify-center gap-1.5 shadow-inner">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>RESQ-Dispatch - Simulated flood scenario, synthetic data</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* App Title & Pitch */}
        <div className="flex items-center gap-3">
          <div className="bg-sky-600 text-white p-2 rounded-xl shadow-md flex items-center justify-center">
            <LifeBuoy className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                RESQ-Dispatch
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">
                AI Dispatch Brain
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Offline-First Emergency Flood Coordination
            </p>
          </div>
        </div>

        {/* Controls: Offline Toggle + Queue Badge */}
        <div className="flex items-center gap-3">
          {/* Offline Mode Toggle for Demo */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setSimulatedOffline(!isOffline)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                isOffline
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 shadow-xs hover:bg-slate-50'
              }`}
              title="Toggle simulated network loss to demonstrate offline queueing"
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Simulated Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Online</span>
                </>
              )}
            </button>
          </div>

          <StatusBadge status={queueStatus} onFlush={onFlushQueue} />
        </div>
      </div>

      {/* Demo User Switcher Bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>Role Switcher:</span>
          </div>

          <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-medium">
            <button
              onClick={() => setRole('citizen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                role === 'citizen'
                  ? 'bg-white text-sky-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Citizen / Field (/report)</span>
            </button>

            <button
              onClick={() => setRole('dispatcher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                role === 'dispatcher'
                  ? 'bg-white text-sky-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Dispatcher Dashboard (/dispatch)</span>
            </button>

            <button
              onClick={() => setRole('responder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                role === 'responder'
                  ? 'bg-white text-sky-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Rescue Responder</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
