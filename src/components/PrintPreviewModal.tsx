import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Grid,
  Layers,
  Sliders,
  Check,
  Maximize2
} from 'lucide-react';
import {
  PaperSize,
  PhotoPreset,
  PrintSheetConfig,
  PrintMode
} from '../types';
import { PAPER_SIZES, PASSPORT_STAMP_PRESETS } from '../data/presets';
import { calculatePrintGrid, renderPrintSheetCanvas, triggerDirectPrint } from '../utils/printLayout';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  passportCanvas: HTMLCanvasElement | null;
  activePreset: PhotoPreset;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  passportCanvas,
  activePreset,
}) => {
  const [selectedPaperId, setSelectedPaperId] = useState<string>('4x6');
  const [printMode, setPrintMode] = useState<PrintMode>('single');
  const [passportCount, setPassportCount] = useState<number>(8);
  const [stampCount, setStampCount] = useState<number>(4);
  const [showCutLines, setShowCutLines] = useState<boolean>(true);
  const [cutLineStyle, setCutLineStyle] = useState<'dashed' | 'solid' | 'crop-marks'>('dashed');
  const [photoGapMm, setPhotoGapMm] = useState<number>(3);
  const [marginMm, setMarginMm] = useState<number>(4);
  const [borderStyle, setBorderStyle] = useState<'none' | 'thin-line'>('thin-line');
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const selectedPaper = PAPER_SIZES.find(p => p.id === selectedPaperId) || PAPER_SIZES[0];
  const stampPreset = PASSPORT_STAMP_PRESETS.find(p => p.category === 'stamp') || PASSPORT_STAMP_PRESETS[6];

  const sheetConfig: PrintSheetConfig = {
    paperSizeId: selectedPaperId,
    printMode,
    passportCount,
    stampCount,
    showCutLines,
    cutLineStyle,
    photoGapMm,
    marginMm,
    orientation: 'portrait',
    borderStyle,
    dpi: 300,
  };

  // Calculate layout grid
  const gridResult = calculatePrintGrid(
    selectedPaper,
    activePreset,
    stampPreset,
    sheetConfig
  );

  // Render sheet preview
  useEffect(() => {
    if (!isOpen || !passportCanvas) return;

    const sheetCanvas = renderPrintSheetCanvas(
      selectedPaper,
      passportCanvas,
      passportCanvas, // use same canvas for stamp preview in combo mode
      activePreset,
      stampPreset,
      sheetConfig
    );

    setPreviewDataUrl(sheetCanvas.toDataURL('image/png'));
  }, [
    isOpen,
    passportCanvas,
    selectedPaperId,
    printMode,
    passportCount,
    stampCount,
    showCutLines,
    cutLineStyle,
    photoGapMm,
    marginMm,
    borderStyle,
    activePreset,
  ]);

  if (!isOpen) return null;

  const handleDirectPrint = () => {
    if (!previewDataUrl) return;
    triggerDirectPrint(previewDataUrl, gridResult.paperWidthMm, gridResult.paperHeightMm);
  };

  const handleDownloadSheet = () => {
    if (!previewDataUrl) return;
    const a = document.createElement('a');
    a.href = previewDataUrl;
    a.download = `Photo_Print_Sheet_${selectedPaper.id}_${activePreset.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Batch Photo Print Sheet Layout</h2>
              <p className="text-xs text-zinc-400">
                Arrange photos on paper size sheet with cutting marks for high-resolution 300 DPI print.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Controls Panel */}
          <div className="w-full md:w-80 lg:w-96 border-r border-zinc-800 bg-zinc-950/80 p-5 overflow-y-auto space-y-5 custom-scrollbar">
            {/* Paper Size Selection */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5 text-indigo-400" />
                Select Photo Paper Size
              </h2>
              <div className="space-y-1.5">
                {PAPER_SIZES.map((paper) => (
                  <button
                    key={paper.id}
                    onClick={() => setSelectedPaperId(paper.id)}
                    className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                      selectedPaperId === paper.id
                        ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-md'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs">{paper.name}</div>
                      <div className="text-[10px] text-zinc-400">{paper.description}</div>
                    </div>
                    {selectedPaperId === paper.id && (
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Print Mode */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Sheet Layout Mode
              </h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setPrintMode('single')}
                  className={`p-3 rounded-xl border font-semibold transition ${
                    printMode === 'single'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  Single Type
                </button>
                <button
                  onClick={() => setPrintMode('mixed')}
                  className={`p-3 rounded-xl border font-semibold transition ${
                    printMode === 'mixed'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  Combo Sheet
                </button>
              </div>
            </div>

            {/* Photo Quantity Control */}
            <div className="space-y-3 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
              {printMode === 'single' ? (
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-zinc-300">Number of Copies</span>
                    <span className="font-mono text-indigo-400 font-bold">{passportCount} Copies</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[2, 4, 6, 8, 12, 16, 24, gridResult.maxCapacity].map((num) => (
                      <button
                        key={num}
                        onClick={() => setPassportCount(num)}
                        className={`flex-1 py-1 text-xs rounded-lg border transition ${
                          passportCount === num
                            ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {num === gridResult.maxCapacity ? 'Max' : num}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-zinc-300 font-medium block mb-1">
                      Passport Photos ({activePreset.name}): {passportCount}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="16"
                      value={passportCount}
                      onChange={(e) => setPassportCount(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-300 font-medium block mb-1">
                      Stamp Photos ({stampPreset.name}): {stampCount}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="24"
                      value={stampCount}
                      onChange={(e) => setStampCount(parseInt(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cut Lines & Spacing */}
            <div className="space-y-3 bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Cutting Guidelines & Spacing
              </span>

              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Show Cut / Crop Lines</span>
                <input
                  type="checkbox"
                  checked={showCutLines}
                  onChange={(e) => setShowCutLines(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {showCutLines && (
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {(['dashed', 'solid', 'crop-marks'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setCutLineStyle(style)}
                      className={`py-1 text-[11px] rounded-lg border capitalize transition ${
                        cutLineStyle === style
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {style.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              )}

              {/* Photo Gap Slider */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between">
                  <span className="text-zinc-300">Photo Gap</span>
                  <span className="font-mono text-emerald-400">{photoGapMm} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={photoGapMm}
                  onChange={(e) => setPhotoGapMm(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Canvas View */}
          <div className="flex-1 bg-zinc-950 p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="text-center mb-3">
              <span className="text-xs text-zinc-400 font-mono">
                LIVE 300 DPI SHEET PREVIEW ({gridResult.items.length} PHOTOS PLACED)
              </span>
            </div>

            {previewDataUrl ? (
              <div className="relative border-4 border-zinc-800 rounded-2xl overflow-hidden shadow-2xl bg-white max-h-[60vh]">
                <img
                  src={previewDataUrl}
                  alt="Print Sheet Preview"
                  className="max-h-[58vh] max-w-full object-contain block"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="text-zinc-500 text-xs font-mono">Generating Sheet Preview...</div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 font-mono">
            CAPACITY: <span className="font-bold text-zinc-200">{gridResult.items.length} PHOTOS</span> ON {selectedPaper.name.toUpperCase()}
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-export-sheet-png"
              onClick={handleDownloadSheet}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold flex items-center gap-2 border border-zinc-700 transition"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Download 300 DPI Image</span>
            </button>

            <button
              id="btn-trigger-printer"
              onClick={handleDirectPrint}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sheet Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
