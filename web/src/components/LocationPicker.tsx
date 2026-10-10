import React, { useState, useEffect } from 'react';
import { LocationData } from '../types/report';
import { MapPin, Navigation, Edit3, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  location: LocationData;
  onChange: (location: LocationData) => void;
}

// Default Mumbai flood prone reference (Kurla East / Mithi River corridor)
const DEFAULT_FALLBACK_LAT = 19.0688;
const DEFAULT_FALLBACK_LNG = 72.8789;

export const LocationPicker: React.FC<Props> = ({ location, onChange }) => {
  const [isLocating, setIsLocating] = useState(false);
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [manualAddress, setManualAddress] = useState(location.manualAddress || '');
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Auto-detect GPS on first mount if not already acquired
  useEffect(() => {
    if (location.lat === 0 && location.lng === 0) {
      detectGPS();
    }
  }, []);

  const detectGPS = () => {
    setIsLocating(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your device. Using standard coordinates.');
      onChange({
        lat: DEFAULT_FALLBACK_LAT,
        lng: DEFAULT_FALLBACK_LNG,
        accuracy: 50,
        manualAddress: 'Kurla East, Mumbai (Estimated)',
        source: 'manual',
      });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
          manualAddress: location.manualAddress || 'GPS detected location',
          source: 'gps',
        });
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setGpsError('GPS signal weak/blocked. Switched to fallback incident coordinate.');
        onChange({
          lat: DEFAULT_FALLBACK_LAT,
          lng: DEFAULT_FALLBACK_LNG,
          accuracy: 100,
          manualAddress: 'Bail Bazar, Kurla East, Mumbai',
          source: 'manual',
        });
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  const handleManualCoordChange = (latStr: string, lngStr: string) => {
    const lat = parseFloat(latStr) || DEFAULT_FALLBACK_LAT;
    const lng = parseFloat(lngStr) || DEFAULT_FALLBACK_LNG;
    onChange({
      ...location,
      lat,
      lng,
      source: 'manual',
    });
  };

  const handleAddressChange = (addr: string) => {
    setManualAddress(addr);
    onChange({
      ...location,
      manualAddress: addr,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-sky-600" />
          <span>Incident Location</span>
        </label>
        <button
          type="button"
          onClick={() => setIsManualEdit(!isManualEdit)}
          className="text-xs text-sky-600 hover:text-sky-800 font-medium flex items-center gap-1"
        >
          <Edit3 className="w-3 h-3" />
          <span>{isManualEdit ? 'Done Editing' : 'Manual Coordinates Fallback'}</span>
        </button>
      </div>

      {gpsError && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Primary Location Card */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex p-1.5 rounded-lg ${
              location.source === 'gps' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
            }`}>
              <Navigation className="w-4 h-4" />
            </span>
            <div>
              <div className="text-xs font-mono font-bold text-slate-800">
                {location.lat !== 0 ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Acquiring GPS...'}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                {location.source === 'gps' ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-600 inline" />
                    <span>Auto-GPS (accuracy ±{location.accuracy || 15}m)</span>
                  </>
                ) : (
                  <span>Manual / Fallback coordinate</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={detectGPS}
            disabled={isLocating}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-2xs disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 text-sky-600 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Refresh GPS'}</span>
          </button>
        </div>

        {/* Address / Landmark text */}
        <div>
          <input
            type="text"
            value={manualAddress}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="Landmark / Floor / Street name (e.g. Near Shiv Mandir, 2nd floor, Kurla)"
            className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        {/* Manual Latitude & Longitude overrides when toggled */}
        {isManualEdit && (
          <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 font-mono">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={location.lat}
                onChange={(e) => handleManualCoordChange(e.target.value, String(location.lng))}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-mono">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={location.lng}
                onChange={(e) => handleManualCoordChange(String(location.lat), e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
