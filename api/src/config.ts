import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 8080,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  projectId: process.env.PROJECT_ID || 'resq-dispatch-demo',
};
