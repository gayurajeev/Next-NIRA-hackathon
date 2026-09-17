'use client';

import React, { useState } from 'react';
import { DrainageClassificationResult } from '@/lib/drainageClassifierService';
import { DrainageIssueType, SeverityLevel } from '@/lib/niraTypes';
import {
  Sparkles,
  Cpu,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Droplets,
  CheckCircle2,
  Info,
  RefreshCw,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

export interface AIAnalysisCardProps {
  result: DrainageClassificationResult | null;
  isAnalyzing: boolean;
  error?: string | null;
  onRetry?: () => void;
  onApplyClassification?: (issueType: DrainageIssueType, severity: SeverityLevel) => void;
  className?: string;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({
  result,
  isAnalyzing,
  error,
  onRetry,
  onApplyClassification,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div
      className={`bg-white rounded-3xl p-6 border-2 border-blue-200 shadow-sm transition-all space-y-4 ${className}`}
    >
      {/* 1. CARD TOP HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#256BF5] flex items-center justify-center font-black">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              AI-Assisted Incident Analysis
            </h3>
            <span className="inline-block text-[10px] font-bold text-slate-400">
              Vision Feature Extraction & Obstruction Triage
            </span>
          </div>
        </div>

        {/* Prototype Classification Disclaimer Pill (Mandatory Requirement) */}
        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
          AI-assisted prototype analysis
        </span>
      </div>

      {/* 2. LOADING STATE WITH SUBTLE SCANNING ANIMATION */}
      {isAnalyzing && (
        <div className="p-6 rounded-2xl bg-[#EDF4FF] border border-blue-200 text-center space-y-3 relative overflow-hidden">
          {/* Scanning Line Animation Effect */}
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#256BF5] to-transparent animate-pulse top-0"></div>

          <div className="flex items-center justify-center">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-blue-300 border-t-[#256BF5] animate-spin"></div>
              <Cpu className="w-6 h-6 text-[#256BF5] animate-pulse" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-black text-[#256BF5]">
              Scanning Drainage Imagery...
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Extracting obstruction vectors, sediment depth, and water surface pooling
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#256BF5] animate-ping"></span>
            <span>Running prototype vision heuristic inference</span>
          </div>
        </div>
      )}

      {/* 3. ERROR STATE */}
      {!isAnalyzing && error && (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-2">
          <div className="flex items-center gap-2 font-black text-xs text-red-700">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>Image Analysis Interrupted</span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
            {error || 'Unable to detect clear drainage patterns in the provided photo. You may retry or manually set issue details.'}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-xs transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry Analysis</span>
            </button>
          )}
        </div>
      )}

      {/* 4. FALLBACK STATE (No photo or result available yet) */}
      {!isAnalyzing && !error && !result && (
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 text-slate-500">
          <Info className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-700">
            Awaiting Citizen Photo Submission
          </p>
          <p className="text-[11px] font-medium text-slate-500 max-w-sm mx-auto">
            Upload a camera photo or choose a reference scenario above to trigger AI-assisted incident analysis.
          </p>
        </div>
      )}

      {/* 5. SUCCESSFUL AI ANALYSIS DISPLAY (Matches Required Specification) */}
      {!isAnalyzing && !error && result && (
        <div className="space-y-4 animate-fadeIn">
          {/* TOP ROW: CATEGORY, CONFIDENCE GAUGE, SEVERITY BADGE */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Classified Issue Type
              </span>
              <h4 className="text-base font-black text-slate-900 mt-0.5">
                {result.categoryName.toUpperCase()}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {/* Confidence Visualization */}
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500">Confidence:</span>
                <span className="text-xs font-black text-[#256BF5] font-mono">
                  {result.confidence}%
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>

              {/* Severity Badge */}
              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase ${
                  result.severity === 'CRITICAL'
                    ? 'bg-red-100 text-[#EF4444] border border-red-200'
                    : result.severity === 'HIGH'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : result.severity === 'MEDIUM'
                    ? 'bg-blue-100 text-[#256BF5] border border-blue-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {result.severity}
              </span>
            </div>
          </div>

          {/* CONFIDENCE VISUALIZATION PROGRESS BAR */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-500">
              <span>Model Confidence Meter</span>
              <span className="font-mono">{result.confidence} / 100</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
              <div
                style={{ width: `${result.confidence}%` }}
                className="h-full rounded-full bg-[#256BF5] transition-all duration-700"
              ></div>
            </div>
          </div>

          {/* TWO KEY ATTRIBUTES: POSSIBLE OBSTRUCTION & STANDING WATER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Possible Obstruction */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Possible Obstruction
              </span>
              <p className="font-black text-slate-900 leading-snug">
                {result.possibleObstruction}
              </p>
            </div>

            {/* Standing Water */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Standing Water
              </span>
              <div className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-[#256BF5]" />
                <span className="font-black text-slate-900">{result.standingWater}</span>
              </div>
            </div>
          </div>

          {/* DETECTION FACTORS BULLET LIST */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2 text-xs">
            <span className="text-[10px] font-black uppercase text-[#256BF5] tracking-wider block">
              Detection Factors Identified
            </span>
            <ul className="space-y-1.5">
              {result.detectionFactors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700 font-medium leading-tight">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* EXPANDABLE: "WHY DID NIRA CLASSIFY THIS?" */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100/80 transition-colors"
            >
              <span className="flex items-center gap-1.5 font-black text-slate-800">
                <Info className="w-3.5 h-3.5 text-[#256BF5]" />
                <span>Why did NIRA classify this?</span>
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isExpanded && (
              <div className="p-4 pt-1 text-xs text-slate-600 space-y-2 border-t border-slate-200/80 bg-white">
                <p className="leading-relaxed font-medium">
                  {result.reasoningSummary}
                </p>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-medium">
                  <strong className="text-slate-800 font-bold block mb-0.5">Classification Disclaimer:</strong>
                  {result.modelDisclaimer}
                </div>
              </div>
            )}
          </div>

          {/* AUTO-SYNC TO FORM CONFIRMATION */}
          {onApplyClassification && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500 font-medium">
                Auto-synced to report classification and priority scoring engine
              </span>
              <button
                type="button"
                onClick={() => onApplyClassification(result.issueType, result.severity)}
                className="text-[11px] font-black text-[#256BF5] hover:underline flex items-center gap-1"
              >
                <Sliders className="w-3 h-3" />
                <span>Re-apply Parameters</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
