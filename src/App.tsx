import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageCropper } from './components/ImageCropper';
import { AdjustmentPanel } from './components/AdjustmentPanel';
import { ComplianceChecker } from './components/ComplianceChecker';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { WebcamModal } from './components/WebcamModal';
import {
  PhotoPreset,
  CropState,
  ClarityAdjustments,
  BackgroundSettings
} from './types';
import { PASSPORT_STAMP_PRESETS, SAMPLE_PHOTOS } from './data/presets';
import { detectFaceHeuristics } from './utils/imageProcessing';

export default function App() {
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PhotoPreset>(PASSPORT_STAMP_PRESETS[0]);
  const [customWidthMm, setCustomWidthMm] = useState<number>(35);
  const [customHeightMm, setCustomHeightMm] = useState<number>(45);

  const [crop, setCrop] = useState<CropState>({
    x: 0.2,
    y: 0.1,
    width: 0.6,
    height: 0.75,
    zoom: 1.0,
    rotation: 0,
    fineTilt: 0,
  });

  const [adjustments, setAdjustments] = useState<ClarityAdjustments>({
    brightness: 0,
    contrast: 5,
    saturation: 0,
    sharpness: 25, // Default crisp studio clarity
    smoothing: 10,
    warmth: 0,
    autoBalance: false,
  });

  const [background, setBackground] = useState<BackgroundSettings>({
    mode: 'original',
    color: '#FFFFFF',
    tolerance: 35,
    feather: 2,
  });

  const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [isAiAdviceLoading, setIsAiAdviceLoading] = useState<boolean>(false);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isWebcamOpen, setIsWebcamOpen] = useState<boolean>(false);

  // Load default sample photo on boot
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageElement(img);
      const heuristic = detectFaceHeuristics(img);
      setCrop(prev => ({
        ...prev,
        x: heuristic.cropX,
        y: heuristic.cropY,
        width: heuristic.cropW,
        height: heuristic.cropH,
      }));
    };
    img.src = SAMPLE_PHOTOS[0].url;
  }, []);

  // Handle local image file upload
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const img = new Image();
        img.onload = () => {
          setImageElement(img);
          const heuristic = detectFaceHeuristics(img);
          setCrop({
            x: heuristic.cropX,
            y: heuristic.cropY,
            width: heuristic.cropW,
            height: heuristic.cropH,
            zoom: 1.0,
            rotation: 0,
            fineTilt: 0,
          });
        };
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sampleUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageElement(img);
      const heuristic = detectFaceHeuristics(img);
      setCrop({
        x: heuristic.cropX,
        y: heuristic.cropY,
        width: heuristic.cropW,
        height: heuristic.cropH,
        zoom: 1.0,
        rotation: 0,
        fineTilt: 0,
      });
    };
    img.src = sampleUrl;
  };

  // AI Auto Face Detection & Intelligent Crop Box
  const handleAiAutoDetect = async () => {
    if (!imageElement) return;

    setIsAiProcessing(true);
    try {
      // Convert image to base64
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(800, imageElement.naturalWidth);
      canvas.height = Math.round(canvas.width * (imageElement.naturalHeight / imageElement.naturalWidth));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      }
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);

      const response = await fetch('/api/ai/detect-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg' }),
      });

      if (!response.ok) {
        throw new Error('Server AI detection fallback');
      }

      const data = await response.json();
      if (data.suggestedCropBox) {
        const box = data.suggestedCropBox;
        setCrop({
          x: box.xmin / 1000,
          y: box.ymin / 1000,
          width: (box.xmax - box.xmin) / 1000,
          height: (box.ymax - box.ymin) / 1000,
          zoom: 1.0,
          rotation: 0,
          fineTilt: 0,
        });

        if (data.qualityAnalysis?.recommendations) {
          setAiTips(data.qualityAnalysis.recommendations);
        }
      }
    } catch (err) {
      console.log('AI endpoint fallback to heuristic auto-crop:', err);
      const heuristic = detectFaceHeuristics(imageElement);
      setCrop(prev => ({
        ...prev,
        x: heuristic.cropX,
        y: heuristic.cropY,
        width: heuristic.cropW,
        height: heuristic.cropH,
      }));
    } finally {
      setIsAiProcessing(false);
    }
  };

  // AI Studio Quality Advice & Adjustments
  const handleAiEnhanceAdvice = async () => {
    if (!imageElement) return;

    setIsAiAdviceLoading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = Math.round(600 * (imageElement.naturalHeight / imageElement.naturalWidth));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      }
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

      const res = await fetch('/api/ai/enhance-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, targetSize: selectedPreset.name }),
      });

      if (res.ok) {
        const data = await res.json();
        setAdjustments({
          brightness: data.brightness ?? 0,
          contrast: data.contrast ?? 10,
          saturation: 0,
          sharpness: Math.max(20, data.sharpness ?? 30),
          smoothing: data.noiseReduction ?? 10,
          warmth: data.warmth ?? 0,
          autoBalance: true,
        });

        if (data.technicianTips) {
          setAiTips(data.technicianTips);
        }
      }
    } catch (err) {
      console.log('AI enhance advice fallback:', err);
      setAdjustments(prev => ({ ...prev, sharpness: 35, contrast: 10 }));
    } finally {
      setIsAiAdviceLoading(false);
    }
  };

  const handleResetAdjustments = () => {
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      smoothing: 0,
      warmth: 0,
      autoBalance: false,
    });
    setBackground({
      mode: 'original',
      color: '#FFFFFF',
      tolerance: 35,
      feather: 2,
    });
    if (imageElement) {
      const heuristic = detectFaceHeuristics(imageElement);
      setCrop({
        x: heuristic.cropX,
        y: heuristic.cropY,
        width: heuristic.cropW,
        height: heuristic.cropH,
        zoom: 1.0,
        rotation: 0,
        fineTilt: 0,
      });
    }
  };

  const handleExportSinglePhoto = () => {
    if (!processedCanvas) return;
    const a = document.createElement('a');
    a.href = processedCanvas.toDataURL('image/jpeg', 0.95);
    a.download = `Photo_${selectedPreset.id}_${Date.now()}.jpg`;
    a.click();
  };

  // Drag and Drop File Upload on main workspace
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  // Keyboard Shortcuts (P for print, + / - for zoom, R for rotate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'p' || e.key === 'P') {
        setIsPrintModalOpen(true);
      } else if (e.key === '+' || e.key === '=') {
        setCrop(c => ({ ...c, zoom: Math.min(3.0, c.zoom + 0.1) }));
      } else if (e.key === '-') {
        setCrop(c => ({ ...c, zoom: Math.max(0.5, c.zoom - 0.1) }));
      } else if (e.key === 'r' || e.key === 'R') {
        setCrop(c => ({ ...c, rotation: (c.rotation + 90) % 360 }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden select-none"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Studio Header Toolbar */}
      <Header
        onImageUpload={handleImageUpload}
        onSelectSample={handleSelectSample}
        onOpenWebcam={() => setIsWebcamOpen(true)}
        onAiAutoDetect={handleAiAutoDetect}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onExportSinglePhoto={handleExportSinglePhoto}
        onResetAdjustments={handleResetAdjustments}
        isAiProcessing={isAiProcessing}
        hasImage={!!imageElement}
      />

      {/* Main Studio Bento Workspace */}
      <div className="flex-1 p-4 grid grid-cols-12 gap-4 overflow-hidden relative bg-zinc-950">
        {/* Central Interactive Photo Canvas View (Bento Module) */}
        <section className="col-span-12 lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden relative flex flex-col shadow-xl">
          <ImageCropper
            imageElement={imageElement}
            preset={selectedPreset}
            crop={crop}
            onChangeCrop={setCrop}
            adjustments={adjustments}
            background={background}
            showGuides={showGuides}
            onToggleGuides={() => setShowGuides(prev => !prev)}
            onProcessedCanvasChange={setProcessedCanvas}
          />
        </section>

        {/* Right Controls & Adjustments (Bento Module) */}
        <section className="col-span-12 lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col shadow-xl">
          <AdjustmentPanel
            selectedPreset={selectedPreset}
            onSelectPreset={(p) => {
              setSelectedPreset(p);
              setCustomWidthMm(p.widthMm);
              setCustomHeightMm(p.heightMm);
            }}
            customWidthMm={customWidthMm}
            customHeightMm={customHeightMm}
            onCustomSizeChange={(w, h) => {
              setCustomWidthMm(w);
              setCustomHeightMm(h);
              setSelectedPreset({
                id: 'custom',
                name: `Custom (${w}x${h}mm)`,
                category: 'passport',
                widthMm: w,
                heightMm: h,
                description: 'Custom dimensions specified by studio operator.',
                headRatioMinPct: 60,
                headRatioMaxPct: 80,
                requiredBgColor: '#FFFFFF',
              });
            }}
            adjustments={adjustments}
            onChangeAdjustments={setAdjustments}
            background={background}
            onChangeBackground={setBackground}
            onAiEnhanceAdvice={handleAiEnhanceAdvice}
            isAiAdviceLoading={isAiAdviceLoading}
            aiTips={aiTips}
          />
        </section>
      </div>

      {/* Bottom Compliance & Status Bar */}
      <footer className="bg-zinc-900 border-t border-zinc-800">
        <ComplianceChecker
          preset={selectedPreset}
          crop={crop}
          adjustments={adjustments}
        />
      </footer>

      {/* Print Sheet Batch Layout Modal */}
      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        passportCanvas={processedCanvas}
        activePreset={selectedPreset}
      />

      {/* Live Webcam Modal */}
      <WebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={handleImageUpload}
      />
    </div>
  );
}
