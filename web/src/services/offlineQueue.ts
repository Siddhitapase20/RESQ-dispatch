import { FloodReport } from '../types/report';
import { db, isFirebaseConfigured } from './firebase';
import { doc, setDoc, serverTimestamp, collection, getDocs, onSnapshot } from 'firebase/firestore';

const DB_NAME = 'resq_dispatch_offline_db';
const DB_VERSION = 1;
const QUEUE_STORE = 'queued_reports';
const SYNCED_STORE = 'synced_reports';

export interface QueueStatus {
  queuedCount: number;
  syncedCount: number;
  isSimulatedOffline: boolean;
  isBrowserOnline: boolean;
  lastSyncAt: Date | null;
}

let dbInstance: IDBDatabase | null = null;
let simulatedOffline: boolean = false;
const listeners: Array<(status: QueueStatus) => void> = [];

// Generate idempotent client document ID
export function generateReportId(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  return `rep_${ts}_${rand}`;
}

export function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(QUEUE_STORE)) {
        database.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(SYNCED_STORE)) {
        database.createObjectStore(SYNCED_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getQueuedReports(): Promise<FloodReport[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(QUEUE_STORE, 'readonly');
    const store = tx.objectStore(QUEUE_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as FloodReport[]);
    req.onerror = () => reject(req.error);
  });
}

export async function getSyncedReports(): Promise<FloodReport[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(SYNCED_STORE, 'readonly');
    const store = tx.objectStore(SYNCED_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as FloodReport[]);
    req.onerror = () => reject(req.error);
  });
}

export function parseFirestoreDoc(id: string, data: any): FloodReport {
  let receivedAtStr: string | null = null;
  if (data.receivedAt) {
    if (typeof data.receivedAt.toDate === 'function') {
      receivedAtStr = data.receivedAt.toDate().toISOString();
    } else if (typeof data.receivedAt === 'string') {
      receivedAtStr = data.receivedAt;
    }
  }

  return {
    id,
    text: data.text || '',
    location: data.location || { lat: 0, lng: 0, source: 'manual' },
    clientCreatedAt: data.clientCreatedAt || new Date().toISOString(),
    receivedAt: receivedAtStr,
    synced: true,
    preliminaryNeed: data.preliminaryNeed,
    photoBase64: data.photoBase64,
    audioBase64: data.audioBase64,
    audioDurationSec: data.audioDurationSec,
    contactPhone: data.contactPhone,
    aiExtracted: data.aiExtracted,
    incidentId: data.incidentId,
    urgency: data.urgency,
    confidence: data.confidence,
  };
}

export async function getAllReports(): Promise<FloodReport[]> {
  const queued = await getQueuedReports();
  let synced: FloodReport[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'reports'));
      snap.forEach((docSnap) => {
        synced.push(parseFirestoreDoc(docSnap.id, docSnap.data()));
      });
    } catch (err) {
      console.warn('[RESQ-Dispatch] Firestore read fallback to local store:', err);
      synced = await getSyncedReports();
    }
  } else {
    synced = await getSyncedReports();
  }

  const map = new Map<string, FloodReport>();
  for (const s of synced) {
    map.set(s.id, s);
  }
  for (const q of queued) {
    map.set(q.id, { ...q, synced: false });
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.clientCreatedAt).getTime() - new Date(a.clientCreatedAt).getTime()
  );
}

async function notifyListeners(): Promise<void> {
  const queued = await getQueuedReports();
  const synced = await getSyncedReports();
  const status: QueueStatus = {
    queuedCount: queued.length,
    syncedCount: synced.length,
    isSimulatedOffline: simulatedOffline,
    isBrowserOnline: navigator.onLine,
    lastSyncAt: new Date(),
  };

  listeners.forEach(fn => fn(status));
}

export function subscribeQueueStatus(fn: (status: QueueStatus) => void): () => void {
  listeners.push(fn);
  // initial emit
  getQueuedReports().then(async (q) => {
    const s = await getSyncedReports();
    fn({
      queuedCount: q.length,
      syncedCount: s.length,
      isSimulatedOffline: simulatedOffline,
      isBrowserOnline: navigator.onLine,
      lastSyncAt: new Date(),
    });
  });

  return () => {
    const index = listeners.indexOf(fn);
    if (index > -1) listeners.splice(index, 1);
  };
}

export function setSimulatedOffline(offline: boolean): void {
  simulatedOffline = offline;
  notifyListeners();
  if (!offline) {
    // If turning back online, trigger flush
    flushOfflineQueue();
  }
}

export function isOfflineMode(): boolean {
  return simulatedOffline || !navigator.onLine;
}

// Queue report or immediately sync if connected
export async function submitReport(reportData: Omit<FloodReport, 'id' | 'clientCreatedAt' | 'synced' | 'receivedAt'>): Promise<FloodReport> {
  const id = generateReportId();
  const clientCreatedAt = new Date().toISOString();

  const report: FloodReport = {
    ...reportData,
    id,
    clientCreatedAt,
    synced: false,
    receivedAt: null,
  };

  const database = await openDatabase();

  if (isOfflineMode()) {
    // Save to offline queue
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(QUEUE_STORE, 'readwrite');
      tx.objectStore(QUEUE_STORE).put(report);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    console.log(`[RESQ-Dispatch] Report ${id} queued offline.`);
    await notifyListeners();
    return report;
  }

  // If online, attempt direct sync
  try {
    const syncedReport = await syncSingleReport(report);
    await notifyListeners();
    return syncedReport;
  } catch (err) {
    console.warn(`[RESQ-Dispatch] Direct sync failed, falling back to local queue:`, err);
    // Queue locally on failure
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(QUEUE_STORE, 'readwrite');
      tx.objectStore(QUEUE_STORE).put(report);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await notifyListeners();
    return report;
  }
}

// Write to cloud or local synced store with idempotency
async function syncSingleReport(report: FloodReport): Promise<FloodReport> {
  const database = await openDatabase();
  const receivedAt = new Date().toISOString();

  const updatedReport: FloodReport = {
    ...report,
    synced: true,
    receivedAt,
  };

  if (isFirebaseConfigured && db) {
    try {
      // Idempotent write via setDoc with client-generated ID into Firestore "reports" collection
      const reportRef = doc(db, 'reports', report.id);
      
      const firestoreData: Record<string, any> = {
        id: report.id,
        text: report.text || '',
        location: report.location,
        clientCreatedAt: report.clientCreatedAt,
        receivedAt: serverTimestamp(),
        synced: true,
      };

      if (report.preliminaryNeed) firestoreData.preliminaryNeed = report.preliminaryNeed;
      if (report.photoBase64) firestoreData.photoBase64 = report.photoBase64;
      if (report.audioBase64) firestoreData.audioBase64 = report.audioBase64;
      if (report.audioDurationSec !== undefined) firestoreData.audioDurationSec = report.audioDurationSec;
      if (report.contactPhone) firestoreData.contactPhone = report.contactPhone;

      await setDoc(reportRef, firestoreData, { merge: true });
      console.log(`[RESQ-Dispatch] Written report ${report.id} to Firestore collection "reports".`);
    } catch (err) {
      console.error('[RESQ-Dispatch] Firestore sync error:', err);
      throw err;
    }
  }

  // Move from queued store to synced store in IndexedDB
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction([QUEUE_STORE, SYNCED_STORE], 'readwrite');
    tx.objectStore(QUEUE_STORE).delete(report.id);
    tx.objectStore(SYNCED_STORE).put(updatedReport);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return updatedReport;
}

// Subscribe to real-time reports stream from Firestore and offline queue
export function subscribeReports(callback: (reports: FloodReport[]) => void): () => void {
  let isSubscribed = true;

  const triggerUpdate = async () => {
    if (!isSubscribed) return;
    const all = await getAllReports();
    callback(all);
  };

  let unsubscribeFirestore: (() => void) | null = null;
  if (isFirebaseConfigured && db) {
    try {
      const reportsColl = collection(db, 'reports');
      unsubscribeFirestore = onSnapshot(reportsColl, () => {
        triggerUpdate();
      }, (err) => {
        console.warn('[RESQ-Dispatch] Firestore snapshot listener warning:', err);
      });
    } catch (err) {
      console.warn('[RESQ-Dispatch] Could not initialize Firestore snapshot:', err);
    }
  }

  const unsubscribeQueue = subscribeQueueStatus(() => {
    triggerUpdate();
  });

  // Initial trigger
  triggerUpdate();

  return () => {
    isSubscribed = false;
    if (unsubscribeFirestore) unsubscribeFirestore();
    unsubscribeQueue();
  };
}

// Flush all offline queued reports idempotently
export async function flushOfflineQueue(): Promise<{ syncedCount: number; errors: any[] }> {
  if (isOfflineMode()) {
    console.log('[RESQ-Dispatch] Cannot flush offline queue while in offline mode.');
    return { syncedCount: 0, errors: [] };
  }

  const queued = await getQueuedReports();
  if (queued.length === 0) return { syncedCount: 0, errors: [] };

  console.log(`[RESQ-Dispatch] Flushing ${queued.length} offline reports...`);
  let syncedCount = 0;
  const errors: any[] = [];

  for (const report of queued) {
    try {
      await syncSingleReport(report);
      syncedCount++;
    } catch (err) {
      errors.push({ id: report.id, error: err });
    }
  }

  await notifyListeners();
  return { syncedCount, errors };
}

// Attach window online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[RESQ-Dispatch] Network back online.');
    notifyListeners();
    if (!simulatedOffline) {
      flushOfflineQueue();
    }
  });

  window.addEventListener('offline', () => {
    console.log('[RESQ-Dispatch] Network offline.');
    notifyListeners();
  });
}
