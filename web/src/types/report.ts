export type NeedType = 'boat' | 'medical' | 'food' | 'shelter' | 'other';

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  manualAddress?: string;
  source: 'gps' | 'manual';
}

export interface AIExtractedData {
  needType: NeedType;
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
  language: string;
  extractionFailed?: boolean;
}

export interface FloodReport {
  id: string; // Client-generated idempotent ID (e.g. rep_...)
  text: string;
  photoBase64?: string;
  audioBase64?: string;
  audioDurationSec?: number;
  location: LocationData;
  preliminaryNeed?: NeedType;
  contactPhone?: string;
  
  // Timestamps
  clientCreatedAt: string; // ISO 8601 when created on device
  receivedAt?: string | null; // ISO 8601 set when received by cloud
  
  // Offline sync flags
  synced: boolean;
  
  // Phase 2-6 enhancements
  aiExtracted?: AIExtractedData;
  incidentId?: string;
  urgency?: number;
  confidence?: number;
}

export type UserRole = 'citizen' | 'dispatcher' | 'responder';
