import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { config } from './config';

let adminDb: admin.firestore.Firestore | null = null;
let isInitialized = false;

export function getAdminFirestore(): admin.firestore.Firestore {
  if (adminDb) return adminDb;

  if (!isInitialized) {
    try {
      const saPath = config.firebaseServiceAccountPath
        ? path.resolve(process.cwd(), config.firebaseServiceAccountPath)
        : '';

      if (saPath && fs.existsSync(saPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id || config.projectId,
        });
        console.log(`[RESQ-Dispatch Admin] Initialized Firebase Admin using service account at: ${saPath}`);
      } else {
        // Fall back to application default credentials or project ID
        admin.initializeApp({
          projectId: config.projectId,
        });
        console.log(`[RESQ-Dispatch Admin] Initialized Firebase Admin using projectId: ${config.projectId}`);
      }
      isInitialized = true;
      adminDb = admin.firestore();
    } catch (err: any) {
      console.warn(`[RESQ-Dispatch Admin] Failed to initialize Firebase Admin SDK: ${err?.message}`);
      throw err;
    }
  }

  if (!adminDb) {
    adminDb = admin.firestore();
  }
  return adminDb;
}
