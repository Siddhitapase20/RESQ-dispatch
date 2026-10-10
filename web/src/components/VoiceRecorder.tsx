import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Volume2, AlertCircle } from 'lucide-react';

interface Props {
  onAudioReady: (audioBase64: string | undefined, durationSec?: number) => void;
}

export const VoiceRecorder: React.FC<Props> = ({ onAudioReady }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    setRecordDuration(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Voice recording is not supported in this browser environment.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Convert blob to Base64 for offline storage and Gemini multimodal payload
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onAudioReady(base64data, recordDuration);
        };
      };

      mediaRecorder.start(200);
      setIsRecording(true);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied or unavailable. You can still type details.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const discardAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordDuration(0);
    audioChunksRef.current = [];
    onAudioReady(undefined);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
        Voice Message / SOS Audio (Supports Hindi, Marathi, English)
      </label>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!audioUrl ? (
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all border border-slate-300 shadow-xs active:scale-95"
            >
              <Mic className="w-4 h-4 text-rose-600" />
              <span>Record Voice SOS</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-300 px-4 py-2 rounded-xl text-rose-700">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
              <span className="text-xs font-mono font-bold tracking-wider">
                RECORDING {formatTime(recordDuration)}
              </span>
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Stop</span>
              </button>
            </div>
          )}
          <span className="text-[11px] text-slate-500">
            {isRecording ? 'Speak clearly; Gemini will translate and extract details.' : 'Optional: citizens can speak in panic.'}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 shrink-0">
            <Volume2 className="w-4 h-4 text-sky-600" />
            <span>Voice ({formatTime(recordDuration)})</span>
          </div>

          <audio src={audioUrl} controls className="h-8 flex-1 max-w-xs" />

          <button
            type="button"
            onClick={discardAudio}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-auto"
            title="Delete recording"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
