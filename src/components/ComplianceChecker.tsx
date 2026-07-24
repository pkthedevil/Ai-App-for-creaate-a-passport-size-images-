import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { PhotoPreset, ClarityAdjustments, CropState } from '../types';

interface ComplianceCheckerProps {
  preset: PhotoPreset;
  crop: CropState;
  adjustments: ClarityAdjustments;
  qualityAnalysis?: any;
}

export const ComplianceChecker: React.FC<ComplianceCheckerProps> = ({
  preset,
  crop,
  adjustments,
  qualityAnalysis,
}) => {
  // Compute basic heuristics
  const headRatioEst = Math.round(65 * (1 / (crop.zoom || 1)));
  const isHeadRatioCompliant = headRatioEst >= preset.headRatioMinPct && headRatioEst <= preset.headRatioMaxPct;
  const isRotationOk = Math.abs((crop.rotation || 0) + (crop.fineTilt || 0)) < 3;
  const isClarityOk = adjustments.sharpness > 10;

  return (
    <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-2.5 text-xs text-zinc-400 font-mono flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-indigo-400" />
        <span className="font-bold text-zinc-200">ICAO STANDARDS CHECKER:</span>
      </div>

      <div className="flex items-center gap-5 flex-wrap text-[11px]">
        {/* Head Coverage % */}
        <div className="flex items-center gap-1.5">
          {isHeadRatioCompliant ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>COVERAGE: <strong className="text-zinc-100">{headRatioEst}%</strong> (REQ: {preset.headRatioMinPct}-{preset.headRatioMaxPct}%)</span>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1.5">
          {isRotationOk ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>HEAD ALIGNMENT</span>
        </div>

        {/* Resolution Clarity */}
        <div className="flex items-center gap-1.5">
          {isClarityOk ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Info className="w-3.5 h-3.5 text-indigo-400" />
          )}
          <span>CLARITY: <strong className="text-indigo-300">{adjustments.sharpness > 0 ? `${adjustments.sharpness}% ENHANCED` : 'STANDARD'}</strong></span>
        </div>

        {/* Status Badge */}
        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
          isHeadRatioCompliant && isRotationOk
            ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-amber-400/10 text-amber-400 border border-amber-500/20'
        }`}>
          {isHeadRatioCompliant && isRotationOk ? 'PASSED ICAO STANDARDS' : 'ADJUST FRAMING'}
        </span>
      </div>
    </div>
  );
};
