'use client';

import React, { useState } from 'react';
import { PriorityTier } from '@/lib/priorityEngine';
import { Info, AlertTriangle } from 'lucide-react';

export interface NIRAPriorityBadgeProps {
  score: number;
  tier?: PriorityTier;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const NIRAPriorityBadge: React.FC<NIRAPriorityBadgeProps> = ({
  score,
  tier: propTier,
  showTooltip = true,
  size = 'md',
  className = '',
}) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  // Derive tier if not provided
  const tier: PriorityTier =
    propTier || (score >= 85 ? 'CRITICAL' : score >= 70 ? 'HIGH' : score >= 50 ? 'MEDIUM' : 'LOW');

  const tierStyles: Record<PriorityTier, { bg: string; text: string; border: string; label: string }> = {
    CRITICAL: {
      bg: 'bg-red-100',
      text: 'text-[#EF4444]',
      border: 'border-red-200',
      label: 'Critical',
    },
    HIGH: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-200',
      label: 'High',
    },
    MEDIUM: {
      bg: 'bg-blue-100',
      text: 'text-[#256BF5]',
      border: 'border-blue-200',
      label: 'Medium',
    },
    LOW: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      label: 'Low',
    },
  };

  const current = tierStyles[tier];

  return (
    <div className={`inline-flex items-center gap-1.5 relative ${className}`}>
      {/* Score and Tier Badge */}
      <span
        className={`font-mono font-black ${
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
        } ${current.text}`}
      >
        {score}/100
      </span>

      <span
        className={`px-2 py-0.5 rounded-full font-black uppercase text-[10px] border ${current.bg} ${current.text} ${current.border}`}
      >
        {current.label}
      </span>

      {/* Operational Prototype Info Tooltip */}
      {showTooltip && (
        <div className="relative inline-flex items-center">
          <button
            type="button"
            onClick={() => setIsTooltipOpen(!isTooltipOpen)}
            onMouseEnter={() => setIsTooltipOpen(true)}
            onMouseLeave={() => setIsTooltipOpen(false)}
            className="text-slate-400 hover:text-[#256BF5] p-0.5 rounded-full transition-colors focus:outline-hidden"
            aria-label="Priority Score Info"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {isTooltipOpen && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl bg-slate-900 text-white text-[11px] leading-snug shadow-xl z-50 pointer-events-none animate-fadeIn border border-slate-700">
              <div className="flex items-center gap-1.5 text-[#FFC800] font-black text-xs mb-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Prototype Operational Prioritization</span>
              </div>
              <p className="text-slate-300 font-normal">
                This score is calculated by an operational triage prototype to assist municipal crew dispatch.
                It is <strong>not</strong> a scientific flood-risk prediction.
              </p>
              <div className="w-2 h-2 bg-slate-900 rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-r border-b border-slate-700"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
