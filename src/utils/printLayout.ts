import { PaperSize, PhotoPreset, PrintSheetConfig } from '../types';

export interface GridItem {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  type: 'passport' | 'stamp';
}

export interface GridCalculationResult {
  items: GridItem[];
  cols: number;
  rows: number;
  paperWidthMm: number;
  paperHeightMm: number;
  maxCapacity: number;
}

/**
 * Calculates grid arrangement for passport & stamp photos on paper sheet
 */
export function calculatePrintGrid(
  paper: PaperSize,
  passportPreset: PhotoPreset,
  stampPreset: PhotoPreset,
  config: PrintSheetConfig
): GridCalculationResult {
  // Determine sheet orientation
  let paperW = paper.widthMm;
  let paperH = paper.heightMm;

  if (config.orientation === 'landscape' && paperW < paperH) {
    paperW = paper.heightMm;
    paperH = paper.widthMm;
  } else if (config.orientation === 'portrait' && paperW > paperH) {
    paperW = paper.heightMm;
    paperH = paper.widthMm;
  }

  const gap = config.photoGapMm;
  const margin = config.marginMm;

  const printableWidth = paperW - 2 * margin;
  const printableHeight = paperH - 2 * margin;

  const items: GridItem[] = [];

  if (config.printMode === 'single') {
    // Single type mode
    const pW = passportPreset.widthMm;
    const pH = passportPreset.heightMm;

    const cols = Math.floor((printableWidth + gap) / (pW + gap));
    const rows = Math.floor((printableHeight + gap) / (pH + gap));
    const maxCapacity = cols * rows;

    const countToPlace = Math.min(config.passportCount || maxCapacity, maxCapacity);

    // Center grid on paper
    const totalGridW = cols * pW + (cols - 1) * gap;
    const totalGridH = rows * pH + (rows - 1) * gap;
    const startX = (paperW - totalGridW) / 2;
    const startY = (paperH - totalGridH) / 2;

    let placed = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (placed >= countToPlace) break;
        items.push({
          xMm: startX + c * (pW + gap),
          yMm: startY + r * (pH + gap),
          widthMm: pW,
          heightMm: pH,
          type: passportPreset.category,
        });
        placed++;
      }
      if (placed >= countToPlace) break;
    }

    return { items, cols, rows, paperWidthMm: paperW, paperHeightMm: paperH, maxCapacity };
  } else {
    // Mixed Combo Sheet mode (Passport + Stamp size on same sheet!)
    const passW = passportPreset.widthMm;
    const passH = passportPreset.heightMm;
    const stW = stampPreset.widthMm;
    const stH = stampPreset.heightMm;

    let passCount = config.passportCount || 4;
    let stCount = config.stampCount || 4;

    let currentY = margin;
    let currentX = margin;

    // Place Passport photos first
    let placedPass = 0;
    let rowMaxH = 0;

    while (placedPass < passCount && currentY + passH <= paperH - margin) {
      if (currentX + passW > paperW - margin) {
        currentX = margin;
        currentY += rowMaxH + gap;
        rowMaxH = 0;
      }

      if (currentY + passH > paperH - margin) break;

      items.push({
        xMm: currentX,
        yMm: currentY,
        widthMm: passW,
        heightMm: passH,
        type: 'passport',
      });

      placedPass++;
      currentX += passW + gap;
      rowMaxH = Math.max(rowMaxH, passH);
    }

    // Move to next row for Stamp photos
    if (placedPass > 0) {
      currentX = margin;
      currentY += rowMaxH + gap;
      rowMaxH = 0;
    }

    let placedStamp = 0;
    while (placedStamp < stCount && currentY + stH <= paperH - margin) {
      if (currentX + stW > paperW - margin) {
        currentX = margin;
        currentY += rowMaxH + gap;
        rowMaxH = 0;
      }

      if (currentY + stH > paperH - margin) break;

      items.push({
        xMm: currentX,
        yMm: currentY,
        widthMm: stW,
        heightMm: stH,
        type: 'stamp',
      });

      placedStamp++;
      currentX += stW + gap;
      rowMaxH = Math.max(rowMaxH, stH);
    }

    return {
      items,
      cols: Math.floor((printableWidth + gap) / (passW + gap)),
      rows: Math.floor((printableHeight + gap) / (passH + gap)),
      paperWidthMm: paperW,
      paperHeightMm: paperH,
      maxCapacity: items.length,
    };
  }
}

/**
 * Render high-resolution print sheet canvas at 300 DPI for PNG download or PDF print
 */
export function renderPrintSheetCanvas(
  paper: PaperSize,
  passportCanvas: HTMLCanvasElement,
  stampCanvas: HTMLCanvasElement | null,
  passportPreset: PhotoPreset,
  stampPreset: PhotoPreset,
  config: PrintSheetConfig
): HTMLCanvasElement {
  const grid = calculatePrintGrid(paper, passportPreset, stampPreset, config);

  // 300 DPI: 1 inch = 25.4 mm => 1 mm = 300 / 25.4 = 11.811 pixels
  const mmToPx = config.dpi / 25.4;

  const canvasWidthPx = Math.round(grid.paperWidthMm * mmToPx);
  const canvasHeightPx = Math.round(grid.paperHeightMm * mmToPx);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidthPx;
  canvas.height = canvasHeightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background white sheet
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasWidthPx, canvasHeightPx);

  // Draw photos onto sheet
  for (const item of grid.items) {
    const x = Math.round(item.xMm * mmToPx);
    const y = Math.round(item.yMm * mmToPx);
    const w = Math.round(item.widthMm * mmToPx);
    const h = Math.round(item.heightMm * mmToPx);

    const srcCanvas = item.type === 'stamp' && stampCanvas ? stampCanvas : passportCanvas;

    ctx.drawImage(srcCanvas, x, y, w, h);

    // Border
    if (config.borderStyle === 'thin-line') {
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = Math.max(1, Math.round(mmToPx * 0.2));
      ctx.strokeRect(x, y, w, h);
    }

    // Cut / Crop Marks
    if (config.showCutLines) {
      ctx.save();
      ctx.strokeStyle = '#9CA3AF';
      ctx.lineWidth = Math.max(1, Math.round(mmToPx * 0.15));

      if (config.cutLineStyle === 'dashed') {
        ctx.setLineDash([Math.round(2 * mmToPx), Math.round(2 * mmToPx)]);
        ctx.strokeRect(x, y, w, h);
      } else if (config.cutLineStyle === 'crop-marks') {
        // Corner crop ticks
        const markLen = Math.round(3 * mmToPx);
        ctx.setLineDash([]);

        // Top Left
        ctx.beginPath();
        ctx.moveTo(x - markLen, y); ctx.lineTo(x, y);
        ctx.moveTo(x, y - markLen); ctx.lineTo(x, y);
        ctx.stroke();

        // Top Right
        ctx.beginPath();
        ctx.moveTo(x + w, y); ctx.lineTo(x + w + markLen, y);
        ctx.moveTo(x + w, y - markLen); ctx.lineTo(x + w, y);
        ctx.stroke();

        // Bottom Left
        ctx.beginPath();
        ctx.moveTo(x - markLen, y + h); ctx.lineTo(x, y + h);
        ctx.moveTo(x, y + h); ctx.lineTo(x, y + h + markLen);
        ctx.stroke();

        // Bottom Right
        ctx.beginPath();
        ctx.moveTo(x + w, y + h); ctx.lineTo(x + w + markLen, y + h);
        ctx.moveTo(x + w, y + h); ctx.lineTo(x + w, y + h + markLen);
        ctx.stroke();
      } else {
        ctx.strokeRect(x, y, w, h);
      }
      ctx.restore();
    }
  }

  return canvas;
}

/**
 * Triggers browser direct print with precise millimeter layout styling
 */
export function triggerDirectPrint(printCanvasDataUrl: string, paperW: number, paperH: number) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Passport & Stamp Photo Print Sheet</title>
        <style>
          @page {
            size: ${paperW}mm ${paperH}mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          img {
            width: ${paperW}mm;
            height: ${paperH}mm;
            display: block;
            page-break-after: always;
          }
          @media print {
            body { margin: 0; }
            img { width: 100%; height: 100%; }
          }
        </style>
      </head>
      <body>
        <img src="${printCanvasDataUrl}" onload="window.print(); setTimeout(function(){ window.close(); }, 1000);" />
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
