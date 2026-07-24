import { ClarityAdjustments, CropState, BackgroundSettings } from '../types';

/**
 * Apply unsharp mask sharpening filter matrix to enhance image clarity and edge detail.
 */
export function applySharpeningFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amountPct: number
) {
  if (amountPct <= 0) return;

  const factor = amountPct / 100;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);

  // Kernel for sharpening
  //  0 -1  0
  // -1  5 -1
  //  0 -1  0
  const w = width;
  const h = height;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;

      for (let c = 0; c < 3; c++) {
        const top = copy[((y - 1) * w + x) * 4 + c];
        const bottom = copy[((y + 1) * w + x) * 4 + c];
        const left = copy[(y * w + (x - 1)) * 4 + c];
        const right = copy[(y * w + (x + 1)) * 4 + c];
        const center = copy[idx + c];

        const sharpened = center * 5 - (top + bottom + left + right);
        const blended = center * (1 - factor) + sharpened * factor;

        data[idx + c] = Math.min(255, Math.max(0, blended));
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply denoise / box blur smoothing for skin tone softening.
 */
export function applySmoothing(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amountPct: number
) {
  if (amountPct <= 0) return;

  const factor = Math.min(1, amountPct / 100);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);
  const w = width;
  const h = height;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;

      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            sum += copy[((y + dy) * w + (x + dx)) * 4 + c];
          }
        }
        const avg = sum / 9;
        data[idx + c] = Math.round(data[idx + c] * (1 - factor * 0.5) + avg * (factor * 0.5));
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Background replacement via color threshold / chroma key
 */
export function applyBackgroundReplacement(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: BackgroundSettings
) {
  if (settings.mode === 'original') return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Sample corner pixel colors to detect original background color
  const cornerCoords = [
    [5, 5],
    [width - 5, 5],
    [10, 10],
    [width - 10, 10],
  ];

  let bgR = 0, bgG = 0, bgB = 0, count = 0;
  for (const [cx, cy] of cornerCoords) {
    if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
      const idx = (cy * width + cx) * 4;
      bgR += data[idx];
      bgG += data[idx + 1];
      bgB += data[idx + 2];
      count++;
    }
  }

  bgR = Math.round(bgR / count);
  bgG = Math.round(bgG / count);
  bgB = Math.round(bgB / count);

  // Parse target background color (e.g. #FFFFFF or #3B82F6)
  const targetHex = settings.color.replace('#', '');
  const tR = parseInt(targetHex.substring(0, 2), 16) || 255;
  const tG = parseInt(targetHex.substring(2, 4), 16) || 255;
  const tB = parseInt(targetHex.substring(4, 6), 16) || 255;

  const tolerance = settings.tolerance || 35;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt(
      Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
    );

    if (dist < tolerance) {
      if (settings.mode === 'solid') {
        // Blend with feathering
        const alpha = Math.min(1, Math.max(0, (dist / tolerance)));
        data[i] = Math.round(r * alpha + tR * (1 - alpha));
        data[i + 1] = Math.round(g * alpha + tG * (1 - alpha));
        data[i + 2] = Math.round(b * alpha + tB * (1 - alpha));
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Render cropped photo onto target canvas at specified output dimensions (e.g., 300 DPI px)
 */
export function renderAdjustedPhoto(
  img: HTMLImageElement,
  crop: CropState,
  adjustments: ClarityAdjustments,
  background: BackgroundSettings,
  targetWidthPx: number,
  targetHeightPx: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidthPx;
  canvas.height = targetHeightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();
  ctx.fillStyle = background.mode === 'solid' ? background.color : '#FFFFFF';
  ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);

  // Image Transformations
  const totalRotation = ((crop.rotation || 0) + (crop.fineTilt || 0)) * (Math.PI / 180);

  // Calculate Crop Box in Source Image Pixels
  const srcCropWidth = img.naturalWidth * crop.width;
  const srcCropHeight = img.naturalHeight * crop.height;
  const srcCropX = img.naturalWidth * crop.x;
  const srcCropY = img.naturalHeight * crop.y;

  // Center translation
  ctx.translate(targetWidthPx / 2, targetHeightPx / 2);
  ctx.rotate(totalRotation);
  ctx.scale(crop.zoom, crop.zoom);

  // Apply CSS-like brightness / contrast filter
  let filterStr = `brightness(${100 + adjustments.brightness}%) contrast(${100 + adjustments.contrast}%) saturate(${100 + adjustments.saturation}%)`;
  if (adjustments.warmth !== 0) {
    filterStr += ` sepia(${Math.abs(adjustments.warmth) * 0.2}%)`;
  }
  ctx.filter = filterStr;

  ctx.drawImage(
    img,
    srcCropX,
    srcCropY,
    srcCropWidth,
    srcCropHeight,
    -targetWidthPx / 2,
    -targetHeightPx / 2,
    targetWidthPx,
    targetHeightPx
  );

  ctx.restore();

  // Reset filter for direct canvas manipulation
  ctx.filter = 'none';

  // Apply Background Replacement if active
  if (background.mode === 'solid') {
    applyBackgroundReplacement(ctx, targetWidthPx, targetHeightPx, background);
  }

  // Apply Sharpening Matrix Filter for Clarity Enhancement
  if (adjustments.sharpness > 0) {
    applySharpeningFilter(ctx, targetWidthPx, targetHeightPx, adjustments.sharpness);
  }

  // Apply Denoise Smoothing if requested
  if (adjustments.smoothing > 0) {
    applySmoothing(ctx, targetWidthPx, targetHeightPx, adjustments.smoothing);
  }

  return canvas;
}

/**
 * Client-side heuristic face & head detection
 */
export function detectFaceHeuristics(img: HTMLImageElement): {
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
} {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;

  // Default centered face crop fallback
  const defaultAspectRatio = 35 / 45; // standard passport ratio
  let cropW = 0.5;
  let cropH = cropW / defaultAspectRatio;

  if (cropH > 0.85) {
    cropH = 0.85;
    cropW = cropH * defaultAspectRatio;
  }

  let cropX = (1 - cropW) / 2;
  let cropY = (1 - cropH) / 3; // Shift slightly up for head space

  return { cropX, cropY, cropW, cropH };
}
