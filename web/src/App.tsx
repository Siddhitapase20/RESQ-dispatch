import { useState, useEffect, useCallback } from 'react';
import { UserRole, FloodReport } from './types/report';
import { 
  QueueStatus, 
  subscribeQueueStatus, 
  subscribeReports,
  getAllReports, 
  flushOfflineQueue 
} from './services/offlineQueue';
import { Header } from './components/Header';
import { CitizenReport } from './pages/CitizenReport';
import { DispatchDashboard } from './pages/DispatchDashboard';
import { ResponderView } from './pages/ResponderView';

export function App() {
  const [role, setRole] = useState<UserRole>('citizen');
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    queuedCount: 0,
    syncedCount: 0,
    isSimulatedOffline: false,
    isBrowserOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastSyncAt: null,
  });

  const loadReports = useCallback(async () => {
    try {
      const data = await getAllReports();
      setReports(data);
    } catch (err) {
      console.error('Error loading reports:', err);
    }
  }, []);

  useEffect(() => {
    // Real-time Firestore stream + offline queue reports
    const unsubscribeReports = subscribeReports((updatedReports) => {
      setReports(updatedReports);
    });

    // Offline queue badge status
    const unsubscribeQueue = subscribeQueueStatus((status) => {
      setQueueStatus(status);
    });

    return () => {
      unsubscribeReports();
      unsubscribeQueue();
    };
  }, []);

  const handleFlush = async () => {
    await flushOfflineQueue();
    await loadReports();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header
        role={role}
        setRole={setRole}
        queueStatus={queueStatus}
        onFlushQueue={handleFlush}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {role === 'citizen' && (
          <CitizenReport
            reports={reports}
            onReportCreated={loadReports}
            isOfflineMode={queueStatus.isSimulatedOffline || !queueStatus.isBrowserOnline}
          />
        )}

        {role === 'dispatcher' && (
          <DispatchDashboard
            reports={reports}
            onRefresh={loadReports}
          />
        )}

        {role === 'responder' && (
          <ResponderView reports={reports} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>RESQ-Dispatch</strong> &bull; HackSprint Google Hackathon Prototype
          </span>
          <span className="text-[11px] text-slate-400">
            Stack: React PWA + Vite + Tailwind | Cloud Run + Node.js | Firestore Offline IndexedDB | Gemini AI
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
