import { isOfflineMode } from './offlineQueue';
import { db, isFirebaseConfigured } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { AIExtractedData } from '../types/report';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export async function triggerGeminiExtraction(reportId: string, fallbackReport?: any): Promise<any> {
  if (isOfflineMode()) {
    console.log('[RESQ-Dispatch AI] Skipping Gemini call: device is currently in offline mode.');
    return null;
  }

  try {
    // Optimistically mark status in Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        const reportRef = doc(db, 'reports', reportId);
        await setDoc(reportRef, { aiStatus: 'extracting' }, { merge: true });
      } catch (e) {
        console.warn('Could not set optimistic status in Firestore:', e);
      }
    }

    const response = await fetch(`${API_BASE}/api/processReport`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportId,
        report: fallbackReport,
      }),
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.error(`[RESQ-Dispatch AI] Failed to request Gemini extraction for ${reportId}:`, err);
    
    // Mark as failed in Firestore so dispatcher can enter manually
    if (isFirebaseConfigured && db) {
      try {
        const reportRef = doc(db, 'reports', reportId);
        await setDoc(reportRef, {
          aiStatus: 'failed',
          aiError: err?.message || 'Network error reaching extraction API',
          aiExtractedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (e) {
        // ignore
      }
    }
    throw err;
  }
}

export async function saveDispatcherEdits(reportId: string, edits: Partial<AIExtractedData>): Promise<void> {
  const payload = {
    ...edits,
    editedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    const reportRef = doc(db, 'reports', reportId);
    await setDoc(reportRef, { dispatcherEdits: payload }, { merge: true });
    console.log(`[RESQ-Dispatch] Saved dispatcher edits for report ${reportId}`);
  }
}
