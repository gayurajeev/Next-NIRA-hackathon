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
      className={`bg-white rounded-3xl p-6 border border-slate-200 shadow-sm transition-all space-y-4 ${className}`}
    >
      {/* 1. REPORT HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#256BF5] flex items-center justify-center font-black">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">
              AI Analysis Report
            </h3>
            <span className="text-[11px] font-medium text-slate-500">
              Computer vision inspection of drain photo
            </span>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#256BF5] text-[10px] font-bold border border-blue-100 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> AI Verified
        </span>
      </div>

      {/* 2. LOADING STATE */}
      {isAnalyzing && (
        <div className="p-6 rounded-2xl bg-[#EDF4FF] border border-blue-200 text-center space-y-3">
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-blue-300 border-t-[#256BF5] animate-spin flex items-center justify-center">
              <Cpu className="w-5 h-5 text-[#256BF5]" />
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-[#256BF5]">
              Generating AI Analysis Report...
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Analyzing obstruction depth, waste accumulation, and standing water
            </p>
          </div>
        </div>
      )}

      {/* 3. ERROR STATE */}
      {!isAnalyzing && error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-black text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>AI Scan Incomplete</span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium">
            {error || 'Unable to scan drain clearly. You can still submit with your chosen details.'}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry AI Analysis</span>
            </button>
          )}
        </div>
      )}

      {/* 4. FALLBACK STATE */}
      {!isAnalyzing && !error && !result && (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5 text-slate-500">
          <Info className="w-5 h-5 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-700">
            AI Analysis Ready
          </p>
          <p className="text-[11px] font-medium text-slate-500">
            Photo will be analyzed automatically by our civic AI model.
          </p>
        </div>
      )}

      {/* 5. AI ANALYSIS REPORT CONTENT */}
      {!isAnalyzing && !error && result && (
        <div className="space-y-3.5 animate-fadeIn">
          {/* Main Finding Banner: Issue, Confidence, Severity */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  AI Classification
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">
                  {result.categoryName}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-mono font-bold">
                  {result.confidence}% Match
                </span>
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${
                    result.severity === 'CRITICAL'
                      ? 'bg-red-100 text-[#EF4444] border border-red-200'
                      : result.severity === 'HIGH'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : result.severity === 'MEDIUM'
                      ? 'bg-blue-100 text-[#256BF5] border border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {result.severity === 'CRITICAL' ? 'High Risk' : `${result.severity.toLowerCase()} risk`}
                </span>
              </div>
            </div>

            {/* AI Summary Statement */}
            <p className="text-xs text-slate-600 font-medium leading-relaxed pt-2 border-t border-slate-200/80">
              {result.reasoningSummary}
            </p>
          </div>

          {/* Key Findings: Obstruction & Standing Water */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-white border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Detected Obstruction
              </span>
              <p className="font-bold text-slate-800 leading-snug">
                {result.possibleObstruction}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Standing Water Status
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Droplets className="w-3.5 h-3.5 text-[#256BF5]" />
                <span>{result.standingWater}</span>
              </div>
            </div>
          </div>

          {/* AI Identified Factors */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
            <span className="text-[10px] font-black uppercase text-[#256BF5] tracking-wider block">
              AI Detection Points
            </span>
            <ul className="space-y-1.5 text-xs">
              {result.detectionFactors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-slate-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
