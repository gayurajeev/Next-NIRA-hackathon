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
  defaultExpanded = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  const { score, tier, slaHours, factors, explanation } = priorityData;

  const tierStyles: Record<
    PriorityTier,
    {
      badgeBg: string;
      badgeText: string;
      badgeBorder: string;
      barColor: string;
      label: string;
    }
  > = {
    CRITICAL: {
      badgeBg: 'bg-red-100',
      badgeText: 'text-[#EF4444]',
      badgeBorder: 'border-red-200',
      barColor: 'bg-[#EF4444]',
      label: 'Critical Priority',
    },
    HIGH: {
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200',
      barColor: 'bg-[#FFC800]',
      label: 'High Priority',
    },
    MEDIUM: {
      badgeBg: 'bg-blue-100',
      badgeText: 'text-[#256BF5]',
      badgeBorder: 'border-blue-200',
      barColor: 'bg-[#256BF5]',
      label: 'Medium Priority',
    },
    LOW: {
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
      badgeBorder: 'border-emerald-200',
      barColor: 'bg-emerald-500',
      label: 'Standard Priority',
    },
  };

  const style = tierStyles[tier];

  return (
    <div
      className={`bg-white rounded-3xl p-6 border border-slate-200 shadow-sm transition-all space-y-4 ${className}`}
    >
      {/* 1. CARD HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Response Priority
            </h3>
            <span className="text-[11px] font-medium text-slate-500">
              Assigned timeline for municipal field crew
            </span>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
          Auto Assessed
        </span>
      </div>

      {/* 2. PRIORITY LEVEL & TARGET TIMELINE */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Calculated Level
            </span>
            <span
              className={`inline-block px-3 py-1 rounded-xl text-xs font-black uppercase mt-1 border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder}`}
            >
              {style.label}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Response Target
            </span>
            <div className="text-sm font-black text-slate-900 mt-1 flex items-center justify-end gap-1">
              <Clock className="w-3.5 h-3.5 text-[#256BF5]" />
              <span>Within {slaHours} hours</span>
            </div>
          </div>
        </div>

        {/* Priority Level Bar */}
        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
          <div
            style={{ width: `${score}%` }}
            className={`h-full rounded-full transition-all duration-700 ${style.barColor}`}
          ></div>
        </div>

        {/* Friendly 1-sentence explanation */}
        <p className="text-xs text-slate-600 font-medium leading-relaxed pt-1">
          {explanation}
        </p>
      </div>

      {/* 3. COLLAPSIBLE FACTOR BREAKDOWN (Collapsed by default) */}
      {showExpandableBreakdown && (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              <Info className="w-3.5 h-3.5 text-[#256BF5]" />
              <span>View score breakdown ({score}/100)</span>
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {isExpanded && (
            <div className="p-3.5 pt-2 border-t border-slate-200 bg-white space-y-2.5">
              <div className="divide-y divide-slate-100 text-xs">
                {factors.map((factor, idx) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">
                        {factor.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {factor.description}
                      </span>
                    </div>
                    <span className="font-mono font-black text-[#256BF5] text-xs">
                      +{factor.points}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-black text-slate-900 border-t border-slate-200">
                <span className="text-slate-500 uppercase text-[10px]">Total Score</span>
                <span className="font-mono text-[#256BF5] text-sm">{score} / 100</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
