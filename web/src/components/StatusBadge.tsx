import React from 'react';
import { QueueStatus } from '../services/offlineQueue';
import { CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';

interface Props {
  status: QueueStatus;
  onFlush?: () => void;
}

export const StatusBadge: React.FC<Props> = ({ status, onFlush }) => {
  const isOffline = status.isSimulatedOffline || !status.isBrowserOnline;

  if (status.queuedCount > 0) {
    return (
      <div className="flex items-center gap-2">
        <span 
          title={`${status.queuedCount} reports queued in local storage`}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 border border-amber-300 dark:border-amber-500/30 animate-pulse"
        >
          <CloudOff className="w-3.5 h-3.5" />
          Queued offline ({status.queuedCount})
        </span>
        {!isOffline && onFlush && (
          <button
            onClick={onFlush}
            className="p-1 text-slate-500 hover:text-sky-600 transition-colors"
            title="Flush queue now"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <span 
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-300 dark:border-emerald-500/30"
      title={isOffline ? "No pending reports (offline mode)" : "All reports synced to cloud"}
    >
      {isOffline ? (
        <>
          <CloudOff className="w-3.5 h-3.5 text-slate-400" />
          Offline (0 queued)
        </>
      ) : (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Synced
        </>
      )}
    </span>
  );
};
