import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  Maximize2,
  Eye,
  Grid,
  Sparkles,
  Move
} from 'lucide-react';
import { ClarityAdjustments, CropState, PhotoPreset, BackgroundSettings } from '../types';
import { renderAdjustedPhoto } from '../utils/imageProcessing';

interface ImageCropperProps {
  imageElement: HTMLImageElement | null;
  preset: PhotoPreset;
  crop: CropState;
  onChangeCrop: (newCrop: CropState) => void;
  adjustments: ClarityAdjustments;
  background: BackgroundSettings;
  showGuides: boolean;
  onToggleGuides: () => void;
  onProcessedCanvasChange: (canvas: HTMLCanvasElement) => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageElement,
  preset,
  crop,
  onChangeCrop,
  adjustments,
  background,
  showGuides,
  onToggleGuides,
  onProcessedCanvasChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [gridOverlay, setGridOverlay] = useState<'head-oval' | 'thirds' | 'off'>('head-oval');

  // Calculate target pixel resolution at 300 DPI
  const targetWidthPx = Math.round((preset.widthMm / 25.4) * 300);
  const targetHeightPx = Math.round((preset.heightMm / 25.4) * 300);

  // Render photo whenever crop, image, adjustments or background changes
  const updateCanvas = useCallback(() => {
    if (!imageElement || !canvasRef.current) return;

    const processed = renderAdjustedPhoto(
      imageElement,
      crop,
      adjustments,
      background,
      targetWidthPx,
      targetHeightPx
    );

    const destCtx = canvasRef.current.getContext('2d');
    if (!destCtx) return;

    canvasRef.current.width = processed.width;
    canvasRef.current.height = processed.height;
    destCtx.clearRect(0, 0, processed.width, processed.height);
    destCtx.drawImage(processed, 0, 0);

    onProcessedCanvasChange(processed);
  }, [imageElement, crop, adjustments, background, targetWidthPx, targetHeightPx, onProcessedCanvasChange]);

  useEffect(() => {
    updateCanvas();
  }, [updateCanvas]);

  // Handle Drag / Pan inside canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageElement) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageElement) return;

    const dx = (e.clientX - dragStart.x) * 0.0015;
    const dy = (e.clientY - dragStart.y) * 0.0015;

    onChangeCrop({
      ...crop,
      x: Math.max(0, Math.min(1 - crop.width, crop.x - dx)),
      y: Math.max(0, Math.min(1 - crop.height, crop.y - dy)),
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!imageElement) return;
    e.preventDefault();

    const zoomDelta = e.deltaY > 0 ? -0.05 : 0.05;
    const newZoom = Math.max(0.5, Math.min(3.5, crop.zoom + zoomDelta));

    onChangeCrop({
      ...crop,
      zoom: parseFloat(newZoom.toFixed(2)),
    });
  };

  const rotateStep = (degrees: number) => {
    onChangeCrop({
      ...crop,
      rotation: (crop.rotation + degrees) % 360,
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-900 p-4 relative select-none overflow-hidden h-full">
      {/* Top Studio View Status Bar */}
      <div className="flex items-center justify-between mb-3 text-xs text-zinc-400 bg-zinc-950/80 px-3.5 py-2 rounded-2xl border border-zinc-800/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-zinc-200">{preset.name}</span>
          <span className="text-zinc-600">•</span>
          <span>{preset.widthMm} x {preset.heightMm} mm</span>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <span className="text-zinc-400 hidden sm:inline">300 DPI ({targetWidthPx}x{targetHeightPx}px)</span>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setGridOverlay(prev => prev === 'head-oval' ? 'thirds' : prev === 'thirds' ? 'off' : 'head-oval')}
            className={`p-1.5 rounded-xl border text-xs font-medium flex items-center gap-1 transition ${
              gridOverlay !== 'off'
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
            title="Toggle Face Alignment Overlay"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{gridOverlay === 'head-oval' ? 'ICAO Face Oval' : gridOverlay === 'thirds' ? 'Grid 3x3' : 'No Grid'}</span>
          </button>

          <button
            onClick={() => rotateStep(-90)}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
            title="Rotate 90° Counter-Clockwise"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => rotateStep(90)}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
            title="Rotate 90° Clockwise"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Main Canvas Area with Dot Matrix Radial Grid */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center relative rounded-2xl bg-zinc-950 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] border border-zinc-800 p-4 min-h-[380px] shadow-inner"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {!imageElement ? (
          <div className="text-center p-8 max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4 text-indigo-400 shadow-xl">
              <Move className="w-8 h-8 opacity-70 animate-bounce" />
            </div>
            <h3 className="text-zinc-200 font-semibold text-sm mb-1">No Photograph Loaded</h3>
            <p className="text-zinc-400 text-xs mb-4">
              Open a photo, webcam scan, or select "Try Samples" in header.
            </p>
          </div>
        ) : (
          <div className="relative group shadow-2xl rounded-xl overflow-hidden border-2 border-indigo-500/50">
            {/* Realtime Canvas */}
            <canvas
              ref={canvasRef}
              className="max-h-[60vh] max-w-[80vw] object-contain cursor-grab active:cursor-grabbing block"
              style={{
                aspectRatio: `${preset.widthMm} / ${preset.heightMm}`,
              }}
            />

            {/* ICAO Official Face Alignment Guidelines Overlay */}
            {gridOverlay === 'head-oval' && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2">
                {/* Crown / Top Head Clearance Limit */}
                <div className="w-full border-b border-dashed border-indigo-400/70 text-[9px] text-indigo-300 text-right pr-1 font-mono uppercase bg-zinc-950/40 backdrop-blur-xs">
                  Crown Top Limit (70-80%)
                </div>

                {/* Eye Level Guide Line */}
                <div className="w-full border-b border-indigo-400/80 flex items-center justify-between px-1 text-[9px] text-indigo-300 font-mono bg-indigo-950/20">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-indigo-400" /> Eye Line</span>
                  <span>Centered</span>
                </div>

                {/* Chin Line Guide */}
                <div className="w-full border-b border-dashed border-amber-400/70 text-[9px] text-amber-300 text-right pr-1 font-mono uppercase bg-zinc-950/40">
                  Chin Bottom Limit
                </div>

                {/* Center Vertical Axis */}
                <div className="absolute inset-y-0 left-1/2 w-px border-l border-dashed border-indigo-400/50"></div>

                {/* Face Oval Frame */}
                <div className="absolute inset-x-[15%] inset-y-[10%] rounded-[50%] border-2 border-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.25)] pointer-events-none"></div>
              </div>
            )}

            {gridOverlay === 'thirds' && (
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
                <div className="border-r border-b border-white/20"></div>
                <div className="border-r border-b border-white/20"></div>
                <div className="border-b border-white/20"></div>
                <div className="border-r border-b border-white/20"></div>
                <div className="border-r border-b border-white/20"></div>
                <div className="border-b border-white/20"></div>
                <div className="border-r border-white/20"></div>
                <div className="border-r border-white/20"></div>
                <div></div>
              </div>
            )}

            {/* Canvas Bottom Instruction Badge */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-zinc-900/90 text-zinc-300 text-[10px] px-2.5 py-1 rounded-full border border-zinc-700/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition pointer-events-none shadow-lg font-mono">
              Drag to pan • Scroll to zoom
            </div>
          </div>
        )}
      </div>

      {/* Floating Crop Fine-Tuning Controls Bar */}
      {imageElement && (
        <div className="mt-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-4">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2 text-xs text-zinc-300 flex-1 min-w-[200px]">
            <ZoomOut className="w-3.5 h-3.5 text-zinc-400" />
            <span className="w-12 text-zinc-400 font-mono">{Math.round(crop.zoom * 100)}%</span>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.05"
              value={crop.zoom}
              onChange={(e) => onChangeCrop({ ...crop, zoom: parseFloat(e.target.value) })}
              className="flex-1 accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <ZoomIn className="w-3.5 h-3.5 text-zinc-400" />
          </div>

          {/* Fine Straighten Tilt Slider */}
          <div className="flex items-center gap-2 text-xs text-zinc-300 flex-1 min-w-[200px]">
            <span className="text-zinc-400 font-medium">Straighten:</span>
            <input
              type="range"
              min="-15"
              max="15"
              step="0.5"
              value={crop.fineTilt || 0}
              onChange={(e) => onChangeCrop({ ...crop, fineTilt: parseFloat(e.target.value) })}
              className="flex-1 accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <span className="w-10 text-amber-400 font-mono text-right">{crop.fineTilt || 0}°</span>
          </div>
        </div>
      )}
    </div>
  );
};
