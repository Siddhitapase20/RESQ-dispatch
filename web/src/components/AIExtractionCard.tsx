import React, { useState } from 'react';
import type { FloodReport, NeedType } from '../types/report';
import { saveDispatcherEdits } from '../services/aiService';
import { 
  Sparkles, 
  RotateCw, 
  Edit3, 
  Check, 
  X, 
  AlertTriangle, 
  Users, 
  Waves, 
  Home, 
  HelpCircle,
  FileText
} from 'lucide-react';

interface Props {
  report: FloodReport;
  onRerun: () => void;
  isExtracting: boolean;
  isOffline: boolean;
}

export const AIExtractionCard: React.FC<Props> = ({
  report,
  onRerun,
  isExtracting,
  isOffline,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const ai = report.aiExtracted;
  const edits = report.dispatcherEdits || {};

  // Effective values prioritizing dispatcher edits
  const effectiveNeed: NeedType = edits.needType || ai?.needType || report.preliminaryNeed || 'other';
  const effectivePeopleCount: number | null = edits.peopleCount !== undefined ? edits.peopleCount : (ai?.peopleCount ?? null);
  const effectiveWaterLevel = edits.waterLevel || ai?.waterLevel || 'unknown';
  const effectiveTrapped = edits.trappedIndoors !== undefined ? edits.trappedIndoors : (ai?.trappedIndoors ?? false);
  const effectiveVulnerable = {
    elderly: edits.vulnerable?.elderly !== undefined ? edits.vulnerable.elderly : (ai?.vulnerable?.elderly ?? false),
    pregnant: edits.vulnerable?.pregnant !== undefined ? edits.vulnerable.pregnant : (ai?.vulnerable?.pregnant ?? false),
    disabled: edits.vulnerable?.disabled !== undefined ? edits.vulnerable.disabled : (ai?.vulnerable?.disabled ?? false),
    children: edits.vulnerable?.children !== undefined ? edits.vulnerable.children : (ai?.vulnerable?.children ?? false),
  };

  // Editing form states
  const [editNeed, setEditNeed] = useState<NeedType>(effectiveNeed);
  const [editPeople, setEditPeople] = useState<string>(effectivePeopleCount !== null ? String(effectivePeopleCount) : '');
  const [editWater, setEditWater] = useState(effectiveWaterLevel);
  const [editTrapped, setEditTrapped] = useState(effectiveTrapped);
  const [editElderly, setEditElderly] = useState(effectiveVulnerable.elderly);
  const [editPregnant, setEditPregnant] = useState(effectiveVulnerable.pregnant);
  const [editDisabled, setEditDisabled] = useState(effectiveVulnerable.disabled);
  const [editChildren, setEditChildren] = useState(effectiveVulnerable.children);

  const handleSaveEdits = async () => {
    setIsSaving(true);
    try {
      const parsedPeople = editPeople.trim() === '' ? null : parseInt(editPeople, 10);
      await saveDispatcherEdits(report.id, {
        needType: editNeed,
        peopleCount: isNaN(parsedPeople as number) ? null : parsedPeople,
        waterLevel: editWater as any,
        trappedIndoors: editTrapped,
        vulnerable: {
          elderly: editElderly,
          pregnant: editPregnant,
          disabled: editDisabled,
          children: editChildren,
        },
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save dispatcher edits:', err);
      alert('Failed to save dispatcher edits.');
    } finally {
      setIsSaving(false);
    }
  };

  const getLanguageLabel = (lang?: string) => {
    if (!lang) return 'Unknown';
    switch (lang.toLowerCase()) {
      case 'hi': return 'Hindi (हिंदी)';
      case 'mr': return 'Marathi (मराठी)';
      case 'en': return 'English';
      default: return lang;
    }
  };

  return (
    <div className="mt-3 p-3.5 bg-sky-50/50 rounded-xl border border-sky-200/80 space-y-3">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-600 text-white shadow-2xs">
            <Sparkles className="w-3 h-3" />
            AI-generated
          </span>

          {report.dispatcherEdits && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
              <Check className="w-2.5 h-2.5" />
              Edited by dispatcher
            </span>
          )}

          {ai?.language && (
            <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              Lang: {getLanguageLabel(ai.language)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Re-run extraction button */}
          <button
            type="button"
            onClick={onRerun}
            disabled={isExtracting || isOffline}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-sky-300 rounded-lg text-xs font-semibold shadow-2xs disabled:opacity-40 transition-colors"
            title={isOffline ? "Cannot run Gemini extraction while offline" : "Re-run Gemini extraction"}
          >
            <RotateCw className={`w-3 h-3 ${isExtracting ? 'animate-spin text-sky-600' : ''}`} />
            <span>{isExtracting ? 'Extracting...' : 'Re-run extraction'}</span>
          </button>

          {/* Edit / Enter Manually button */}
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSaveEdits}
                disabled={isSaving}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs disabled:opacity-50"
              >
                <Check className="w-3 h-3" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Extracting State */}
      {isExtracting && (
        <div className="flex items-center gap-2 p-2.5 bg-white/80 rounded-lg border border-sky-200 text-xs text-sky-800">
          <RotateCw className="w-4 h-4 animate-spin text-sky-600 shrink-0" />
          <span className="font-semibold">Extracting...</span>
          <span className="text-[11px] text-slate-500">Gemini Flash multimodal analysis in progress.</span>
        </div>
      )}

      {/* Extraction Failed State */}
      {!isExtracting && report.aiStatus === 'failed' && (
        <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-800 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Extraction failed - enter manually</span>
          </div>
          <p className="text-[11px] text-rose-700">
            {report.aiError || 'Gemini model did not respond. Original report data preserved.'}
          </p>
        </div>
      )}

      {/* View Mode: Labeled Chips */}
      {!isEditing ? (
        <div className="space-y-2.5">
          {/* Summary English sentence */}
          {ai?.summary && (
            <div className="bg-white p-2.5 rounded-lg border border-sky-100 text-xs text-slate-800 flex items-start gap-2 shadow-2xs">
              <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Summary: </span>
                <span className="italic">"{ai.summary}"</span>
              </div>
            </div>
          )}

          {/* Labeled Chips Grid */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {/* Need Type chip */}
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border ${
              edits.needType 
                ? 'bg-amber-50 text-amber-900 border-amber-300' 
                : 'bg-white text-sky-900 border-sky-200'
            }`}>
              <span>Need:</span>
              <span className="uppercase">{effectiveNeed}</span>
              {edits.needType && <span className="text-[9px] text-amber-700 font-normal">(edited)</span>}
            </span>

            {/* People count chip */}
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
              edits.peopleCount !== undefined 
                ? 'bg-amber-50 text-amber-900 border-amber-300' 
                : 'bg-white text-slate-800 border-slate-200'
            }`}>
              <Users className="w-3 h-3 text-slate-500" />
              <span>People:</span>
              <strong>{effectivePeopleCount !== null ? effectivePeopleCount : 'Unknown'}</strong>
              {edits.peopleCount !== undefined && <span className="text-[9px] text-amber-700">(edited)</span>}
            </span>

            {/* Water level chip */}
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
              effectiveWaterLevel === 'waist' || effectiveWaterLevel === 'above'
                ? 'bg-rose-50 text-rose-800 border-rose-200 font-bold'
                : 'bg-white text-slate-800 border-slate-200'
            }`}>
              <Waves className="w-3 h-3 text-sky-600" />
              <span>Water:</span>
              <strong className="capitalize">{effectiveWaterLevel}</strong>
              {edits.waterLevel && <span className="text-[9px] text-amber-700">(edited)</span>}
            </span>

            {/* Trapped chip */}
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
              effectiveTrapped 
                ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold' 
                : 'bg-white text-slate-600 border-slate-200'
            }`}>
              <Home className="w-3 h-3" />
              <span>{effectiveTrapped ? 'Trapped Indoors' : 'Not Trapped'}</span>
            </span>

            {/* Vulnerable groups chips */}
            {(effectiveVulnerable.elderly || effectiveVulnerable.pregnant || effectiveVulnerable.disabled || effectiveVulnerable.children) ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 font-semibold">
                <span>Vulnerable:</span>
                <span className="text-[11px]">
                  {[
                    effectiveVulnerable.elderly && 'Elderly',
                    effectiveVulnerable.pregnant && 'Pregnant',
                    effectiveVulnerable.disabled && 'Disabled',
                    effectiveVulnerable.children && 'Children',
                  ].filter(Boolean).join(', ')}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[11px]">
                No vulnerable groups noted
              </span>
            )}
          </div>

          {/* Location Clues */}
          {ai?.locationClues && ai.locationClues.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700">Location Clues:</span>
              {ai.locationClues.map((clue, idx) => (
                <span key={idx} className="bg-white px-2 py-0.5 rounded border border-slate-200">
                  {clue}
                </span>
              ))}
            </div>
          )}

          {/* Missing Info */}
          {ai?.missingInfo && ai.missingInfo.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200/70">
              <HelpCircle className="w-3 h-3 shrink-0 text-amber-600" />
              <span className="font-semibold">Missing Info:</span>
              <span>{ai.missingInfo.join(' • ')}</span>
            </div>
          )}
        </div>
      ) : (
        /* Edit Mode: Dispatcher Overrides Form */
        <div className="bg-white p-3 rounded-xl border border-sky-300 space-y-3">
          <div className="text-xs font-bold text-sky-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
            <span>Dispatcher Manual Overrides (aiExtracted will be preserved)</span>
            <span className="text-[10px] text-slate-400 font-normal">Saves to dispatcherEdits</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Verified Need Type
              </label>
              <select
                value={editNeed}
                onChange={(e) => setEditNeed(e.target.value as NeedType)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="boat">Rescue Boat</option>
                <option value="medical">Medical Emergency</option>
                <option value="food">Food & Drinking Water</option>
                <option value="shelter">Evacuation Shelter</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                People Count
              </label>
              <input
                type="number"
                min="0"
                value={editPeople}
                onChange={(e) => setEditPeople(e.target.value)}
                placeholder="Leave blank for unknown"
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Water Level
              </label>
              <select
                value={editWater}
                onChange={(e) => setEditWater(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="ankle">Ankle</option>
                <option value="knee">Knee</option>
                <option value="waist">Waist</option>
                <option value="above">Above Waist / Chest</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={editTrapped}
                  onChange={(e) => setEditTrapped(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>Trapped Indoors</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Vulnerable Groups Present:
            </label>
            <div className="flex flex-wrap gap-3 text-xs">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editElderly}
                  onChange={(e) => setEditElderly(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>Elderly</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editPregnant}
                  onChange={(e) => setEditPregnant(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>Pregnant</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editDisabled}
                  onChange={(e) => setEditDisabled(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>Disabled</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editChildren}
                  onChange={(e) => setEditChildren(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>Children</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
