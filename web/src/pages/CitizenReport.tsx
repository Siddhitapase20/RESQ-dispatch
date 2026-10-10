import React, { useState } from 'react';
import { FloodReport, LocationData, NeedType } from '../types/report';
import { submitReport } from '../services/offlineQueue';
import { triggerGeminiExtraction } from '../services/aiService';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { PhotoUploader } from '../components/PhotoUploader';
import { LocationPicker } from '../components/LocationPicker';
import { Send, CheckCircle2, CloudOff, Phone, HelpCircle } from 'lucide-react';

interface Props {
  reports: FloodReport[];
  onReportCreated: () => void;
  isOfflineMode: boolean;
}

const NEED_OPTIONS: { id: NeedType; label: string; icon: string; desc: string }[] = [
  { id: 'boat', label: 'Rescue Boat', icon: '🚤', desc: 'Water high, trapped' },
  { id: 'medical', label: 'Medical Emergency', icon: '🚑', desc: 'Injured / dialysis / pregnant' },
  { id: 'food', label: 'Food & Drinking Water', icon: '🍞', desc: 'Stranded without supplies' },
  { id: 'shelter', label: 'Evacuation Shelter', icon: '⛺', desc: 'Home submerged' },
  { id: 'other', label: 'Other Urgent Help', icon: '🆘', desc: 'General assistance' },
];

export const CitizenReport: React.FC<Props> = ({ reports, onReportCreated, isOfflineMode }) => {
  const [text, setText] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | undefined>();
  const [audioBase64, setAudioBase64] = useState<string | undefined>();
  const [audioDurationSec, setAudioDurationSec] = useState<number | undefined>();
  const [selectedNeed, setSelectedNeed] = useState<NeedType>('boat');
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  const [location, setLocation] = useState<LocationData>({
    lat: 0,
    lng: 0,
    source: 'gps',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !audioBase64 && !photoBase64) {
      alert('Please provide either a text description, a voice note, or a photo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await submitReport({
        text: text.trim(),
        photoBase64,
        audioBase64,
        audioDurationSec,
        preliminaryNeed: selectedNeed,
        contactPhone: contactPhone.trim() || undefined,
        location,
      });

      setSubmitFeedback(
        created.synced
          ? 'SOS Report synced immediately to cloud dispatch! AI extraction started.'
          : 'Network offline: SOS Report saved in local queue. Will auto-sync when online.'
      );

      // Auto-trigger Gemini extraction when synced online
      if (created.synced && !isOfflineMode) {
        triggerGeminiExtraction(created.id, created).catch((err) => {
          console.warn('[RESQ-Dispatch] Extraction trigger:', err.message);
        });
      }

      // Reset form
      setText('');
      setPhotoBase64(undefined);
      setAudioBase64(undefined);
      setAudioDurationSec(undefined);
      setContactPhone('');

      onReportCreated();

      setTimeout(() => {
        setSubmitFeedback(null);
      }, 5000);
    } catch (err: any) {
      console.error('Submission failed:', err);
      alert('Failed to save report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickTemplate = (templateText: string, need: NeedType) => {
    setText(templateText);
    setSelectedNeed(need);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Banner / Instructions */}
      <div className="bg-gradient-to-r from-sky-700 to-sky-900 text-white rounded-2xl p-5 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase bg-sky-500/30 text-sky-200 px-2 py-0.5 rounded-full">
              Citizen & Volunteer SOS
            </span>
            <h2 className="text-xl font-extrabold mt-1">Report Flood Emergency</h2>
            <p className="text-xs text-sky-100/90 mt-1">
              Works completely offline. Describe the situation in Hindi, Marathi, or English. Gemini AI extracts priority, people count, and water depth once received.
            </p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs text-2xl shrink-0">
            🆘
          </div>
        </div>

        {isOfflineMode && (
          <div className="mt-3 bg-amber-400/20 border border-amber-300/40 rounded-xl p-2.5 flex items-center gap-2 text-xs text-amber-100">
            <CloudOff className="w-4 h-4 shrink-0 text-amber-300" />
            <span>
              <strong>Offline Mode Active:</strong> Your report is timestamped with your exact local time and stored in offline storage. Zero data loss.
            </span>
          </div>
        )}
      </div>

      {submitFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{submitFeedback}</span>
        </div>
      )}

      {/* Main Intake Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
        {/* Quick Sample Scenarios for Fast Demo */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              Quick Demo Templates:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() =>
                handleQuickTemplate(
                  'Ground floor submerged near Mithi bridge. 4 people trapped indoors including 1 bedridden elderly and an 8-month pregnant woman. Water level is chest high and rising fast!',
                  'boat'
                )
              }
              className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 rounded-lg border border-slate-200 transition-colors text-left"
            >
              👵 Elderly + Pregnant (High Urgency)
            </button>
            <button
              type="button"
              onClick={() =>
                handleQuickTemplate(
                  'पाणी कमरेपर्यंत आले आहे. 6 लोक छतावर उभे आहेत. लहान मुले भुकेली आहेत आणि पिण्याचे पाणी संपले आहे.',
                  'boat'
                )
              }
              className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 rounded-lg border border-slate-200 transition-colors text-left"
            >
              🚩 Marathi: Roof Trapped Children
            </button>
            <button
              type="button"
              onClick={() =>
                handleQuickTemplate(
                  'हमारे घर में घुटने तक पानी भर गया है। बिजली बंद है और पीने का पानी नहीं है। 3 लोग हैं।',
                  'food'
                )
              }
              className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 rounded-lg border border-slate-200 transition-colors text-left"
            >
              🍞 Hindi: Knee water, needs supplies
            </button>
          </div>
        </div>

        {/* Primary Need Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Primary Need Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {NEED_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedNeed(opt.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedNeed === opt.id
                    ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="text-xl">{opt.icon}</div>
                <div className="text-xs font-bold text-slate-900 mt-1">{opt.label}</div>
                <div className="text-[10px] text-slate-500 line-clamp-1">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Situation Textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Emergency Description (Hindi, Marathi, or English)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Describe who is trapped, water height (knee/waist/chest), landmark, elderly/children..."
            className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 placeholder:text-slate-400"
          />
        </div>

        {/* Voice Note Recording Component */}
        <VoiceRecorder
          onAudioReady={(base64, duration) => {
            setAudioBase64(base64);
            setAudioDurationSec(duration);
          }}
        />

        {/* Photo Upload Component */}
        <PhotoUploader onPhotoReady={(base64) => setPhotoBase64(base64)} />

        {/* Location Picker with GPS & Manual Fallback */}
        <LocationPicker location={location} onChange={setLocation} />

        {/* Contact Phone (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Callback Phone / WhatsApp (Optional)
          </label>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full text-xs pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'Recording SOS...' : 'SUBMIT SOS REPORT'}</span>
        </button>
      </form>

      {/* Local Queue and Recent Reports History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Local Reports History on this Device ({reports.length})
          </h3>
          <span className="text-[11px] text-slate-500">Idempotent local store</span>
        </div>

        {reports.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            No reports created yet on this device.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 text-xs space-y-1.5 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold text-slate-600">
                    {rep.id}
                  </span>
                  <div>
                    {rep.synced ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Synced to Cloud
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                        <CloudOff className="w-3 h-3" />
                        Queued Offline
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-slate-800 line-clamp-2 font-medium">
                  {rep.text || '(Voice / Photo only report)'}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
                  <span>
                    <strong>Captured:</strong> {new Date(rep.clientCreatedAt).toLocaleTimeString()}
                  </span>
                  {rep.receivedAt && (
                    <span>
                      <strong>Cloud Received:</strong> {new Date(rep.receivedAt).toLocaleTimeString()}
                    </span>
                  )}
                  <span>
                    <strong>GPS:</strong> {rep.location.lat.toFixed(4)}, {rep.location.lng.toFixed(4)}
                  </span>
                  {rep.photoBase64 && <span>📷 Photo attached</span>}
                  {rep.audioBase64 && <span>🎙️ Voice attached ({rep.audioDurationSec || 0}s)</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
