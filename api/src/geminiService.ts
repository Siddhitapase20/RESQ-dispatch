import { GoogleGenAI, Type } from '@google/genai';
import { config } from './config';

export interface AIExtractedResult {
  needType: 'boat' | 'medical' | 'food' | 'shelter' | 'other';
  peopleCount: number | null;
  vulnerable: {
    elderly: boolean;
    pregnant: boolean;
    disabled: boolean;
    children: boolean;
  };
  trappedIndoors: boolean;
  locationClues: string[];
  waterLevel: 'ankle' | 'knee' | 'waist' | 'above' | 'unknown';
  missingInfo: string[];
  summary: string;
  language: 'hi' | 'mr' | 'en' | 'other';
}

function parseBase64(dataUriOrBase64: string, defaultMime: string): { mimeType: string; data: string } {
  if (dataUriOrBase64.startsWith('data:')) {
    const parts = dataUriOrBase64.split(';base64,');
    const mimeType = parts[0].replace('data:', '');
    const data = parts[1] || '';
    return { mimeType, data };
  }
  return { mimeType: defaultMime, data: dataUriOrBase64 };
}

export const extractionSchema = {
  type: Type.OBJECT,
  properties: {
    needType: {
      type: Type.STRING,
      enum: ['boat', 'medical', 'food', 'shelter', 'other'],
    },
    peopleCount: {
      type: Type.INTEGER,
      nullable: true,
    },
    vulnerable: {
      type: Type.OBJECT,
      properties: {
        elderly: { type: Type.BOOLEAN },
        pregnant: { type: Type.BOOLEAN },
        disabled: { type: Type.BOOLEAN },
        children: { type: Type.BOOLEAN },
      },
      required: ['elderly', 'pregnant', 'disabled', 'children'],
    },
    trappedIndoors: { type: Type.BOOLEAN },
    locationClues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    waterLevel: {
      type: Type.STRING,
      enum: ['ankle', 'knee', 'waist', 'above', 'unknown'],
    },
    missingInfo: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    summary: { type: Type.STRING },
    language: {
      type: Type.STRING,
      enum: ['hi', 'mr', 'en', 'other'],
    },
  },
  required: [
    'needType',
    'peopleCount',
    'vulnerable',
    'trappedIndoors',
    'locationClues',
    'waterLevel',
    'missingInfo',
    'summary',
    'language',
  ],
};

const SYSTEM_INSTRUCTION =
  'extract only what is stated or clearly visible; use null/"unknown"/false when not stated; never guess; understand Hindi, Marathi and English; do not judge whether the report is genuine.';

async function callGeminiOnce(report: any): Promise<AIExtractedResult> {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }

  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

  const contents: any[] = [];

  // Text content & category hint
  const textPrompt = [
    `EMERGENCY SOS REPORT INPUT:`,
    `- Reported Text: ${report.text || '(No text provided)'}`,
    `- Citizen Selected Category Hint: ${report.preliminaryNeed || 'unspecified'} (Use as hint only, verify against actual evidence)`,
    `- Location details: ${report.location?.manualAddress || ''} [Coords: ${report.location?.lat}, ${report.location?.lng}]`,
  ].join('\n');

  contents.push({ text: textPrompt });

  // Photo part if present
  if (report.photoBase64) {
    const { mimeType, data } = parseBase64(report.photoBase64, 'image/jpeg');
    if (data) {
      contents.push({
        inlineData: {
          mimeType,
          data,
        },
      });
    }
  }

  // Audio part if present
  if (report.audioBase64) {
    const { mimeType, data } = parseBase64(report.audioBase64, 'audio/webm');
    if (data) {
      contents.push({
        inlineData: {
          mimeType,
          data,
        },
      });
    }
  }

  const response = await ai.models.generateContent({
    model: config.geminiModel,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseJsonSchema: extractionSchema,
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error('Empty response received from Gemini model.');
  }

  const parsed = JSON.parse(responseText) as AIExtractedResult;
  return parsed;
}

// Perform extraction with retry logic
export async function extractReportWithGemini(report: any): Promise<{
  success: boolean;
  data?: AIExtractedResult;
  error?: string;
}> {
  try {
    const data = await callGeminiOnce(report);
    return { success: true, data };
  } catch (err1: any) {
    console.warn(`[RESQ-Dispatch Gemini] First attempt failed: ${err1.message}. Retrying once...`);
    try {
      const data = await callGeminiOnce(report);
      return { success: true, data };
    } catch (err2: any) {
      console.error(`[RESQ-Dispatch Gemini] Second attempt failed: ${err2.message}`);
      return {
        success: false,
        error: err2.message || 'Gemini extraction failed after 2 attempts',
      };
    }
  }
}
