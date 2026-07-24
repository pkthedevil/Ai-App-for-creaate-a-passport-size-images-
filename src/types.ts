export type PhotoType = 'passport' | 'stamp' | 'custom';

export interface PhotoPreset {
  id: string;
  name: string;
  category: 'passport' | 'stamp';
  widthMm: number;
  heightMm: number;
  country?: string;
  description: string;
  headRatioMinPct: number; // e.g. 60%
  headRatioMaxPct: number; // e.g. 80%
  requiredBgColor: string;
}

export interface CropState {
  x: number; // 0 to 1
  y: number; // 0 to 1
  width: number; // 0 to 1
  height: number; // 0 to 1
  zoom: number; // 0.5 to 3
  rotation: number; // -180 to 180 degrees
  fineTilt: number; // -10 to +10 degrees
}

export interface ClarityAdjustments {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  sharpness: number; // 0 to 100
  smoothing: number; // 0 to 100 (denoise)
  warmth: number; // -100 to 100
  autoBalance: boolean;
}

export type BackgroundMode = 'original' | 'solid' | 'blur';

export interface BackgroundSettings {
  mode: BackgroundMode;
  color: string; // e.g. "#FFFFFF", "#3B82F6"
  tolerance: number; // 5 to 60 (for background keying)
  feather: number; // 0 to 10
}

export interface PaperSize {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  widthInches: number;
  heightInches: number;
  description: string;
}

export type PrintMode = 'single' | 'mixed';

export interface PrintSheetConfig {
  paperSizeId: string;
  printMode: PrintMode;
  passportCount: number; // e.g. 4, 6, 8
  stampCount: number; // for mixed mode
  showCutLines: boolean;
  cutLineStyle: 'dashed' | 'solid' | 'crop-marks';
  photoGapMm: number; // 0 to 10mm
  marginMm: number; // 2 to 20mm
  orientation: 'portrait' | 'landscape' | 'auto';
  borderStyle: 'none' | 'thin-line' | 'white-margin';
  dpi: number; // 300 for photo print
}

export interface FaceDetectionResult {
  faceBox?: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  };
  suggestedCropBox?: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  };
  qualityAnalysis?: {
    lightingScore: number;
    clarityScore: number;
    complianceStatus: string;
    recommendations: string[];
  };
}
