'use client';

import React, { useState } from 'react';
import { PriorityScoreResult, PriorityTier } from '@/lib/priorityEngine';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  Sliders,
  ShieldAlert,
} from 'lucide-react';

export interface NIRAPriorityCardProps {
  priorityData: PriorityScoreResult;
  showExpandableBreakdown?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export const NIRAPriorityCard: React.FC<NIRAPriorityCardProps> = ({
  priorityData,
  showExpandableBreakdown = true,
  defaultExpanded = true,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const { score, tier, slaHours, factors, explanation } = priorityData;

  const tierStyles: Record<
    PriorityTier,
    {
      badgeBg: string;
      badgeText: string;
      badgeBorder: string;
      barColor: string;
      label: string;
      cardBorder: string;
    }
  > = {
    CRITICAL: {
      badgeBg: 'bg-red-100',
      badgeText: 'text-[#EF4444]',
      badgeBorder: 'border-red-200',
      barColor: 'bg-[#EF4444]',
      label: 'Critical Priority',
      cardBorder: 'border-red-200',
    },
    HIGH: {
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200',
      barColor: 'bg-[#FFC800]',
      label: 'High Priority',
      cardBorder: 'border-amber-200',
    },
    MEDIUM: {
      badgeBg: 'bg-blue-100',
      badgeText: 'text-[#256BF5]',
      badgeBorder: 'border-blue-200',
      barColor: 'bg-[#256BF5]',
      label: 'Medium Priority',
      cardBorder: 'border-blue-200',
    },
    LOW: {
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
      badgeBorder: 'border-emerald-200',
      barColor: 'bg-emerald-500',
      label: 'Low Priority',
      cardBorder: 'border-emerald-200',
    },
  };

  const style = tierStyles[tier];

  return (
    <div
      className={`bg-white rounded-3xl p-6 border-2 border-blue-200 shadow-sm transition-all space-y-4 ${className}`}
    >
      {/* 1. CARD TOP HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                NIRA Priority Score
              </h3>
              {/* Tooltip trigger */}
              <div className="relative inline-flex items-center">
                <button
                  type="button"
                  onClick={() => setShowTooltip(!showTooltip)}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-slate-400 hover:text-[#256BF5] p-0.5 rounded-full transition-colors"
                  aria-label="Prioritization Details"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>

                {showTooltip && (
                  <div className="absolute left-0 top-full mt-1.5 w-72 p-3 rounded-xl bg-slate-900 text-white text-[11px] leading-relaxed shadow-xl z-50 animate-fadeIn border border-slate-700">
                    <div className="flex items-center gap-1.5 text-[#FFC800] font-black text-xs mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Operational Triage Notice</span>
                    </div>
                    <p className="text-slate-300 font-normal">
                      This score is a <strong>prototype operational prioritization</strong> designed to triage civic work orders and monitor response SLAs. It is <strong>not</strong> a scientifically validated flood-risk prediction.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <span className="inline-block text-[10px] font-bold text-slate-400">
              Deterministic Municipal Dispatch Engine
            </span>
          </div>
        </div>

        {/* Prototype Operational Prioritization Pill */}
        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
          Prototype operational prioritization
        </span>
      </div>

      {/* 2. SCORE & TIER DISPLAY */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
            Priority Score
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {score}
            </span>
            <span className="text-sm font-black text-slate-400 font-mono">/ 100</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* SLA Target Pill */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-[#256BF5]" />
            <span>Target: <strong className="font-mono text-slate-900">{slaHours}h</strong></span>
          </div>

          {/* Visual Tier Distinction Badge */}
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder}`}
          >
            {style.label}
          </span>
        </div>
      </div>

      {/* 3. DETERMINISTIC PROGRESS BAR */}
      <div className="space-y-1">
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
          <div
            style={{ width: `${score}%` }}
            className={`h-full rounded-full transition-all duration-700 ${style.barColor}`}
          ></div>
        </div>
      </div>

      {/* 4. EXPANDABLE SECTION: "WHY THIS PRIORITY?" */}
      {showExpandableBreakdown && (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100/80 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-black text-slate-800">
              <Info className="w-3.5 h-3.5 text-[#256BF5]" />
              <span>Why this priority?</span>
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {isExpanded && (
            <div className="p-4 pt-2 border-t border-slate-200/80 bg-white space-y-3">
              {/* Factor by factor point list */}
              <div className="divide-y divide-slate-100 font-mono text-xs">
                {factors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="py-1.5 flex items-center justify-between text-slate-700 font-medium"
                  >
                    <div className="flex flex-col">
                      <span className="font-sans font-bold text-slate-800">
                        {factor.label}
                      </span>
                      <span className="font-sans text-[10px] text-slate-400">
                        {factor.description}
                      </span>
                    </div>
                    <span
                      className={`font-black ${
                        factor.points > 0 ? 'text-[#256BF5]' : 'text-slate-400'
                      }`}
                    >
                      +{factor.points}
                    </span>
                  </div>
                ))}

                {/* Divider Line & Sum Total */}
                <div className="pt-2 flex items-center justify-between text-xs font-black text-slate-900 border-t-2 border-slate-200">
                  <span className="font-sans uppercase text-[11px] tracking-wider text-slate-500">
                    Calculated Total
                  </span>
                  <span className="text-base text-[#256BF5] font-mono font-black">
                    {score}
                  </span>
                </div>
              </div>

              {/* Rationale explanation */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 text-[#256BF5] font-black text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Operational Triage Logic</span>
                </div>
                <p className="text-[11px] leading-relaxed font-medium">
                  {explanation}
                </p>
              </div>

              {/* Disclaimer Notice */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 leading-relaxed font-medium">
                <strong className="text-slate-700 font-bold block mb-0.5">Disclaimer:</strong>
                This score is calculated by an operational triage prototype to assist municipal crew dispatch and SLA monitoring. It is not a calibrated hydraulic or meteorological flood risk prediction.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
