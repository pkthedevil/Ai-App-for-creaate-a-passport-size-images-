import React, { useState } from 'react';
import {
  Crop,
  Sun,
  Palette,
  Sparkles,
  Check,
  RefreshCw,
  SlidersHorizontal,
  Info,
  ShieldCheck
} from 'lucide-react';
import {
  PhotoPreset,
  ClarityAdjustments,
  BackgroundSettings,
  PhotoType
} from '../types';
import { PASSPORT_STAMP_PRESETS } from '../data/presets';

interface AdjustmentPanelProps {
  selectedPreset: PhotoPreset;
  onSelectPreset: (preset: PhotoPreset) => void;
  customWidthMm: number;
  customHeightMm: number;
  onCustomSizeChange: (w: number, h: number) => void;
  adjustments: ClarityAdjustments;
  onChangeAdjustments: (adj: ClarityAdjustments) => void;
  background: BackgroundSettings;
  onChangeBackground: (bg: BackgroundSettings) => void;
  onAiEnhanceAdvice: () => void;
  isAiAdviceLoading: boolean;
  aiTips: string[];
}

export const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({
  selectedPreset,
  onSelectPreset,
  customWidthMm,
  customHeightMm,
  onCustomSizeChange,
  adjustments,
  onChangeAdjustments,
  background,
  onChangeBackground,
  onAiEnhanceAdvice,
  isAiAdviceLoading,
  aiTips,
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'clarity' | 'background'>('preset');
  const [categoryFilter, setCategoryFilter] = useState<PhotoType>('passport');

  const filteredPresets = PASSPORT_STAMP_PRESETS.filter(p => p.category === categoryFilter);

  const backgroundColors = [
    { name: 'Pure White', hex: '#FFFFFF', border: true },
    { name: 'Studio Blue', hex: '#3B82F6' },
    { name: 'Off White', hex: '#FAFAFA', border: true },
    { name: 'Light Gray', hex: '#F3F4F6', border: true },
    { name: 'Red Stamp', hex: '#EF4444' },
    { name: 'Navy Blue', hex: '#1E3A8A' },
  ];

  return (
    <aside className="w-full bg-zinc-900 flex flex-col h-full overflow-hidden text-zinc-200">
      {/* Sidebar Tabs (Bento Style) */}
      <div className="flex items-center border-b border-zinc-800 bg-zinc-950 p-2 gap-1.5">
        <button
          onClick={() => setActiveTab('preset')}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'preset'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Crop className="w-3.5 h-3.5" />
          <span>Size & Preset</span>
        </button>

        <button
          onClick={() => setActiveTab('clarity')}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'clarity'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Clarity & Resolution</span>
        </button>

        <button
          onClick={() => setActiveTab('background')}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'background'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Background</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* TAB 1: SIZE & PRESETS */}
        {activeTab === 'preset' && (
          <div className="space-y-4">
            {/* Category Toggle */}
            <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 text-xs">
              <button
                onClick={() => setCategoryFilter('passport')}
                className={`flex-1 py-2 rounded-xl font-medium transition ${
                  categoryFilter === 'passport' ? 'bg-zinc-800 text-indigo-300 font-bold shadow' : 'text-zinc-400'
                }`}
              >
                Passport Sizes
              </button>
              <button
                onClick={() => setCategoryFilter('stamp')}
                className={`flex-1 py-2 rounded-xl font-medium transition ${
                  categoryFilter === 'stamp' ? 'bg-zinc-800 text-amber-300 font-bold shadow' : 'text-zinc-400'
                }`}
              >
                Stamp Sizes
              </button>
            </div>

            {/* Presets List */}
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                Official Specifications
              </h2>

              {filteredPresets.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => onSelectPreset(preset)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-lg shadow-indigo-950/50'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-zinc-100">{preset.name}</span>
                        {preset.country && (
                          <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                            {preset.country}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-tight">{preset.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        {preset.widthMm} x {preset.heightMm} mm
                      </span>
                      {isSelected && (
                        <div className="mt-1.5 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white ml-auto shadow">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Dimensions Form */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                Custom Millimeter Dimensions
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Width (mm)</label>
                  <input
                    type="number"
                    min="10"
                    max="150"
                    value={customWidthMm}
                    onChange={(e) => onCustomSizeChange(parseFloat(e.target.value) || 35, customHeightMm)}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs text-zinc-100 font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Height (mm)</label>
                  <input
                    type="number"
                    min="10"
                    max="150"
                    value={customHeightMm}
                    onChange={(e) => onCustomSizeChange(customWidthMm, parseFloat(e.target.value) || 45)}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs text-zinc-100 font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLARITY & RESOLUTION ENHANCEMENTS */}
        {activeTab === 'clarity' && (
          <div className="space-y-4">
            {/* AI Studio Quality Header */}
            <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  AI Studio Quality Analysis
                </span>
                <button
                  onClick={onAiEnhanceAdvice}
                  disabled={isAiAdviceLoading}
                  className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isAiAdviceLoading ? 'animate-spin' : ''}`} />
                  <span>Analyze</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">
                Gemini AI evaluates scanned resolution & lighting to recommend studio corrections.
              </p>

              {aiTips.length > 0 && (
                <div className="mt-2 space-y-1 bg-zinc-950 p-3 rounded-xl border border-indigo-500/20">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Technician Tips:</span>
                  {aiTips.map((tip, idx) => (
                    <div key={idx} className="text-[11px] text-zinc-300 flex items-start gap-1.5">
                      <span className="text-indigo-400">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clarity Sliders Bento Module */}
            <div className="space-y-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                Clarity Controls
              </h2>

              {/* Sharpness */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-zinc-200">Sharpness & Detail</span>
                  <span className="font-mono text-indigo-400">{adjustments.sharpness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.sharpness}
                  onChange={(e) => onChangeAdjustments({ ...adjustments, sharpness: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-zinc-500 block">Enhances edges and facial clarity on scanned photos.</span>
              </div>

              {/* Contrast */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-zinc-200">Contrast</span>
                  <span className="font-mono text-indigo-400">{adjustments.contrast}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={adjustments.contrast}
                  onChange={(e) => onChangeAdjustments({ ...adjustments, contrast: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Brightness */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-zinc-200">Brightness</span>
                  <span className="font-mono text-indigo-400">{adjustments.brightness}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={adjustments.brightness}
                  onChange={(e) => onChangeAdjustments({ ...adjustments, brightness: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Skin Smoothing / Denoise */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-zinc-200">Skin Smoothing (Denoise)</span>
                  <span className="font-mono text-indigo-400">{adjustments.smoothing}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.smoothing}
                  onChange={(e) => onChangeAdjustments({ ...adjustments, smoothing: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Warmth / Color Temperature */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-zinc-200">Warmth / Color Temp</span>
                  <span className="font-mono text-amber-400">{adjustments.warmth}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={adjustments.warmth}
                  onChange={(e) => onChangeAdjustments({ ...adjustments, warmth: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BACKGROUND REPLACEMENT */}
        {activeTab === 'background' && (
          <div className="space-y-4">
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-4">
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                Background Replacement
              </h2>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => onChangeBackground({ ...background, mode: 'original' })}
                  className={`p-3 rounded-xl border font-semibold transition ${
                    background.mode === 'original'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => onChangeBackground({ ...background, mode: 'solid' })}
                  className={`p-3 rounded-xl border font-semibold transition ${
                    background.mode === 'solid'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Solid Color
                </button>
              </div>

              {background.mode === 'solid' && (
                <div className="space-y-3 pt-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                    Preset Studio Colors
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {backgroundColors.map((col) => (
                      <button
                        key={col.hex}
                        onClick={() => onChangeBackground({ ...background, color: col.hex })}
                        className={`p-2 rounded-xl border flex items-center gap-2 text-left transition ${
                          background.color === col.hex
                            ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                            : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-zinc-600 shrink-0"
                          style={{ backgroundColor: col.hex }}
                        ></span>
                        <span className="text-[11px] font-medium text-zinc-300 truncate">{col.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Removal Threshold Slider */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-zinc-300">Background Removal Threshold</span>
                      <span className="font-mono text-indigo-400">{background.tolerance}</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="70"
                      value={background.tolerance}
                      onChange={(e) => onChangeBackground({ ...background, tolerance: parseInt(e.target.value) })}
                      className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-zinc-500 block">Adjust if background keying cuts into edges or shoulders.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
