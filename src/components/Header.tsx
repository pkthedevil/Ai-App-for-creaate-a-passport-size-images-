import React, { useRef } from 'react';
import {
  Upload,
  Camera,
  Sparkles,
  Printer,
  Download,
  Image as ImageIcon,
  RotateCcw,
  Sliders,
  Settings
} from 'lucide-react';
import { SAMPLE_PHOTOS } from '../data/presets';

interface HeaderProps {
  onImageUpload: (file: File) => void;
  onSelectSample: (sampleUrl: string) => void;
  onOpenWebcam: () => void;
  onAiAutoDetect: () => void;
  onOpenPrintModal: () => void;
  onExportSinglePhoto: () => void;
  onResetAdjustments: () => void;
  isAiProcessing: boolean;
  hasImage: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onImageUpload,
  onSelectSample,
  onOpenWebcam,
  onAiAutoDetect,
  onOpenPrintModal,
  onExportSinglePhoto,
  onResetAdjustments,
  isAiProcessing,
  hasImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md text-zinc-100 flex-wrap gap-4 z-30 sticky top-0">
      {/* Brand & Scanner Status */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
          <ImageIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-50 flex items-center gap-2">
            Passport & Stamp Studio <span className="text-zinc-500 font-normal text-sm">v2.4</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {/* Connection Status Pill */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
          <span>STUDIO ENGINE READY • 300 DPI</span>
        </div>

        {/* Primary Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* Upload Button */}
          <button
            id="btn-upload-photo"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium rounded-xl border border-zinc-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Open Photo</span>
          </button>

          {/* Webcam Capture */}
          <button
            id="btn-open-webcam"
            onClick={onOpenWebcam}
            className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium rounded-xl border border-zinc-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Camera</span>
          </button>

          {/* Sample Photos Dropdown */}
          <div className="relative group">
            <button
              id="btn-try-sample"
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium rounded-xl border border-zinc-700 transition flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Try Samples</span>
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <p className="text-[10px] font-bold text-indigo-400 px-2 py-1 uppercase tracking-widest">Select Sample Scan</p>
              {SAMPLE_PHOTOS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => onSelectSample(sample.url)}
                  className="w-full text-left p-2 hover:bg-zinc-800/80 rounded-xl text-xs flex items-center gap-2.5 transition text-zinc-200"
                >
                  <img
                    src={sample.url}
                    alt={sample.title}
                    className="w-8 h-8 rounded-lg object-cover border border-zinc-700"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="font-medium text-zinc-100">{sample.title}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{sample.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {hasImage && (
            <>
              {/* AI Auto Face Detect & Enhance */}
              <button
                id="btn-ai-autofit"
                onClick={onAiAutoDetect}
                disabled={isAiProcessing}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 border border-indigo-400/30 disabled:opacity-50 transition"
              >
                <Sparkles className={`w-3.5 h-3.5 text-indigo-200 ${isAiProcessing ? 'animate-spin' : ''}`} />
                <span>{isAiProcessing ? 'Analyzing...' : 'AI Auto-Detect'}</span>
              </button>

              {/* Reset Controls */}
              <button
                id="btn-reset-adjustments"
                onClick={onResetAdjustments}
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition border border-zinc-700"
                title="Reset Adjustments"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Export Single Photo */}
              <button
                id="btn-export-single"
                onClick={onExportSinglePhoto}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium flex items-center gap-1.5 transition border border-zinc-700"
              >
                <Download className="w-3.5 h-3.5 text-zinc-300" />
                <span>Save Photo</span>
              </button>

              {/* Print Sheet Modal Action */}
              <button
                id="btn-open-print-sheet"
                onClick={onOpenPrintModal}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 border border-emerald-400/30 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Sheet</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

