import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

interface Props {
  onPhotoReady: (photoBase64: string | undefined) => void;
}

export const PhotoUploader: React.FC<Props> = ({ onPhotoReady }) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 1024px for efficient offline storage & Gemini vision
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1024;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
          setPhotoPreview(compressedBase64);
          onPhotoReady(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onPhotoReady(undefined);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
        Photo Evidence (Water level / Trapped people / Surroundings)
      </label>

      {!photoPreview ? (
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
            id="flood-photo-input"
          />
          <label
            htmlFor="flood-photo-input"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all border border-slate-300 shadow-xs cursor-pointer active:scale-95"
          >
            <Camera className="w-4 h-4 text-sky-600" />
            <span>Take Photo or Upload</span>
          </label>
          <span className="text-[11px] text-slate-500">
            Helps verify water depth & trapped status automatically.
          </span>
        </div>
      ) : (
        <div className="relative inline-block border-2 border-sky-400 rounded-xl overflow-hidden shadow-sm group">
          <img
            src={photoPreview}
            alt="Flood incident evidence"
            className="w-44 h-32 object-cover"
          />
          <button
            type="button"
            onClick={removePhoto}
            className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors shadow"
            title="Remove photo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-white text-[10px] px-2 py-0.5 flex items-center gap-1 font-mono">
            <ImageIcon className="w-3 h-3 text-sky-400" />
            <span>Attached for AI Analysis</span>
          </div>
        </div>
      )}
    </div>
  );
};
