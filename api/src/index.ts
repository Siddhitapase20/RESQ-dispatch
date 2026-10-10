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

// Skeleton placeholder for Phase 2: Gemini extraction
app.post('/api/reports/:id/process', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({
    message: `Report ${id} received for processing (Phase 2 Gemini extraction placeholder)`,
    reportId: id,
    status: 'pending_extraction',
  });
});

app.listen(config.port, () => {
  console.log(`[RESQ-Dispatch API] Running on port ${config.port}`);
  console.log(`[RESQ-Dispatch API] Health check available at http://localhost:${config.port}/api/health`);
});
