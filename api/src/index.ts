import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';

const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'RESQ-Dispatch API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    scenario: 'Simulated flood scenario, synthetic data',
  });
});

import { getAdminFirestore } from './firebaseAdmin';
import { extractReportWithGemini } from './geminiService';

// Process report with Gemini multimodal extraction
app.post('/api/processReport', async (req: Request, res: Response) => {
  const { reportId, report: fallbackReport } = req.body;

  if (!reportId) {
    return res.status(400).json({ error: 'Missing required field: reportId' });
  }

  try {
    let reportData = fallbackReport;
    let docRef: any = null;

    try {
      const firestore = getAdminFirestore();
      docRef = firestore.collection('reports').doc(reportId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        reportData = docSnap.data();
      }
    } catch (fsErr: any) {
      console.warn(`[RESQ-Dispatch API] Firestore lookup warning: ${fsErr?.message}`);
    }

    if (!reportData) {
      return res.status(404).json({
        error: `Report ${reportId} not found in Firestore and no fallback data provided`,
      });
    }

    console.log(`[RESQ-Dispatch API] Processing report ${reportId} with Gemini (${config.geminiModel})...`);
    const extractionResult = await extractReportWithGemini(reportData);

    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      aiExtractedAt: nowIso,
    };

    if (extractionResult.success && extractionResult.data) {
      updatePayload.aiExtracted = extractionResult.data;
      updatePayload.aiStatus = 'done';
    } else {
      updatePayload.aiStatus = 'failed';
      updatePayload.aiError = extractionResult.error || 'Unknown extraction error';
    }

    // Save back to Firestore without modifying raw report fields
    if (docRef) {
      try {
        await docRef.set(updatePayload, { merge: true });
        console.log(`[RESQ-Dispatch API] Saved extraction status (${updatePayload.aiStatus}) to Firestore doc ${reportId}`);
      } catch (saveErr: any) {
        console.error(`[RESQ-Dispatch API] Error updating Firestore doc: ${saveErr?.message}`);
      }
    }

    return res.json({
      success: extractionResult.success,
      reportId,
      aiStatus: updatePayload.aiStatus,
      aiExtracted: updatePayload.aiExtracted || null,
      aiError: updatePayload.aiError || null,
    });
  } catch (err: any) {
    console.error(`[RESQ-Dispatch API] Unexpected error processing report ${reportId}:`, err);
    return res.status(500).json({
      error: 'Internal server error processing report with Gemini',
      message: err?.message,
    });
  }
});

// Alias endpoint for backwards compatibility
app.post('/api/reports/:id/process', (req: Request, res: Response) => {
  req.body.reportId = req.params.id;
  return (app as any)._router.handle(req, res);
});

app.listen(config.port, () => {
  console.log(`[RESQ-Dispatch API] Running on port ${config.port}`);
  console.log(`[RESQ-Dispatch API] Health check available at http://localhost:${config.port}/api/health`);
});
