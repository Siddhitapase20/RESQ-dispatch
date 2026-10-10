# RESQ-Dispatch

> **RESQ-Dispatch is an AI dispatch brain that converts messy, duplicate, uncertain flood reports into verified, prioritized, trackable rescue tasks, even offline.**
>
> *Note: RESQ-Dispatch - Simulated flood scenario, synthetic data*

## 5-Line Quickstart

```bash
# 1. Install dependencies for web and api
cd web && npm install && cd ../api && npm install && cd ..
# 2. Run backend API (terminal 1)
cd api && npm run dev
# 3. Run frontend PWA (terminal 2)
cd web && npm run dev
# 4. Open in browser: http://localhost:5173
# 5. Toggle "Offline Mode" switch in header to test offline queueing and auto-sync!
```

## Architecture
- **Frontend (`/web`)**: React 18, Vite, TypeScript, Tailwind CSS, Lucide icons, PWA with offline IndexedDB queue + Firestore offline cache.
- **Backend (`/api`)**: Node.js, Express, TypeScript, Dockerfile for Google Cloud Run, Gemini multimodal & embeddings integration.
- **Offline Guarantee**: Client-generated document IDs provide idempotency; reports queue locally when offline and flush without duplicates when reconnected.
- **Demo User Switcher**: Citizen (`/report`), Dispatcher (`/dispatch`), and Responder views accessible with one click in the header.
