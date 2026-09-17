'use client';

import React, { useState, useMemo } from 'react';
import { DrainageReport, ReportStatus } from '@/lib/niraTypes';
import { NIRAPriorityBadge } from './NIRAPriorityBadge';
import { evaluateSla } from '@/lib/slaEngine';
import {
  ClipboardList,
  User,
  MapPin,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Clock,
  FileText,
  Sparkles,
  RefreshCw,
  Search,
  AlertTriangle,
  Flame,
  ArrowRight,
  Maximize2,
  X,
  Building2,
  Check,
  Wrench,
  Camera,
  Layers,
  Inbox,
} from 'lucide-react';

export interface MyReportsProps {
  reports: DrainageReport[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onNavigateToReport?: () => void;
  error?: string | null;
}

export const MyReports: React.FC<MyReportsProps> = ({
  reports,
  isLoading = false,
  onRefresh,
  onNavigateToReport,
  error = null,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeImageModal, setActiveImageModal] = useState<{
    url: string;
    title: string;
    caption?: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleManualRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  // Status counts for filter tabs
  const counts = useMemo(() => {
    return {
      ALL: reports.length,
      OPEN: reports.filter(r => r.status === 'OPEN' || r.status === 'ASSIGNED').length,
      IN_PROGRESS: reports.filter(r => r.status === 'IN_PROGRESS').length,
      RESOLVED: reports.filter(r => r.status === 'RESOLVED').length,
      ESCALATED: reports.filter(r => r.status === 'ESCALATED').length,
    };
  }, [reports]);

  // SLA Calculation Helper (Synchronized with Authority Command Center & centralized SLA engine)
  const getSlaInfo = (report: DrainageReport) => {
    const sla = evaluateSla(report);
    return {
      limit: sla.slaLimitHours,
      elapsedHours: Math.round(sla.elapsedHours * 10) / 10,
      remainingHours: Math.round(sla.remainingHours * 10) / 10,
      isBreached: sla.isBreached,
      isApproaching: sla.isApproaching,
      elapsedFormatted: sla.elapsedFormatted,
      remainingFormatted: sla.remainingFormatted,
      slaState: sla.slaState,
    };
  };

  // Format date helper
  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Format relative time helper
  const formatRelativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(rep => {
      // Status Filter
      if (filterStatus === 'OPEN') {
        if (rep.status !== 'OPEN' && rep.status !== 'ASSIGNED') return false;
      } else if (filterStatus !== 'ALL') {
        if (rep.status !== filterStatus) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = rep.ticket_code.toLowerCase().includes(query);
        const matchesWard = rep.ward.toLowerCase().includes(query);
        const matchesIssue = rep.issue_type.toLowerCase().includes(query);
        const matchesLandmark = rep.landmark.toLowerCase().includes(query);
        if (!matchesCode && !matchesWard && !matchesIssue && !matchesLandmark) {
          return false;
        }
      }

      return true;
    });
  }, [reports, filterStatus, searchQuery]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* =================================================================== */}
      {/* 1. TOP HEADER & METRIC SUMMARY                                      */}
      {/* =================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/nira-logo.png" alt="NIRA Logo" className="w-full h-full object-contain mix-blend-multiply" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                My Submitted Reports
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Public municipal accountability tracker with real-time lifecycle status, crew assignment, and verified resolution evidence.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons: Submit New & Refresh */}
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              title="Refresh tickets from municipal server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin text-[#256BF5]' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          )}

          {onNavigateToReport && (
            <button
              onClick={onNavigateToReport}
              className="px-4 py-2 rounded-xl bg-[#256BF5] hover:bg-blue-600 text-white font-black text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>+ New Report</span>
            </button>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. FILTER TABS & SEARCH BAR                                         */}
      {/* =================================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs (Fund My Crazy Style) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs overflow-x-auto no-scrollbar">
          {[
            { key: 'ALL', label: 'All', count: counts.ALL },
            { key: 'OPEN', label: 'Open', count: counts.OPEN },
            { key: 'IN_PROGRESS', label: 'In Progress', count: counts.IN_PROGRESS },
            { key: 'RESOLVED', label: 'Resolved', count: counts.RESOLVED },
            { key: 'ESCALATED', label: 'Escalated', count: counts.ESCALATED },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                filterStatus === tab.key
                  ? tab.key === 'RESOLVED'
                    ? 'bg-[#10B981] text-white shadow-md shadow-emerald-500/20'
                    : tab.key === 'ESCALATED'
                    ? 'bg-[#EF4444] text-white shadow-md shadow-red-500/20'
                    : 'bg-[#256BF5] text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  filterStatus === tab.key
                    ? 'bg-black/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Instant Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search ticket, ward, issue..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#256BF5] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. ERROR STATE                                                      */}
      {/* =================================================================== */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-black text-sm">Unable to connect to Municipal Registry</p>
            <p className="text-slate-600 font-medium">{error}</p>
            {onRefresh && (
              <button
                onClick={handleManualRefresh}
                className="mt-2 px-3 py-1 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 transition-colors"
              >
                Retry Connection
              </button>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. LOADING STATE                                                    */}
      {/* =================================================================== */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 animate-pulse space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-200"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="h-16 bg-slate-100 rounded-2xl"></div>
              <div className="h-24 bg-slate-100 rounded-2xl"></div>
            </div>
          ))}
          <p className="text-center text-xs text-slate-500 font-bold">
            Synchronizing live reports with Keralam Municipal Corporation database...
          </p>
        </div>
      ) : filteredReports.length === 0 ? (
        /* =================================================================== */
        /* 5. EMPTY STATES                                                     */
        /* =================================================================== */
        reports.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#256BF5] flex items-center justify-center mx-auto shadow-sm">
              <Inbox className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-xl font-black text-slate-900">No Drainage Reports Submitted</h3>
              <p className="text-xs text-slate-600 font-medium">
                You haven&apos;t submitted any drainage blockage reports yet. Spot a clogged culvert, silt buildup, or standing flood water in your ward?
              </p>
            </div>
            {onNavigateToReport && (
              <button
                onClick={onNavigateToReport}
                className="px-6 py-3 rounded-2xl bg-[#256BF5] hover:bg-blue-600 text-white font-black text-xs shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Snap & Report a Blocked Drain</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
            <Search className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-base font-black text-slate-900">No Matching Reports</h4>
            <p className="text-xs text-slate-500 font-medium">
              No reports match filter <strong className="text-slate-800">&quot;{filterStatus}&quot;</strong>
              {searchQuery && <> and search query <strong className="text-slate-800">&quot;{searchQuery}&quot;</strong></>}.
            </p>
            <button
              onClick={() => {
                setFilterStatus('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black text-xs transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )
      ) : (
        /* =================================================================== */
        /* 6. REPORT CARDS LIST                                                */
        /* =================================================================== */
        <div className="space-y-8">
          {filteredReports.map(report => {
            const sla = getSlaInfo(report);
            const isResolved = report.status === 'RESOLVED';
            const isEscalated = report.status === 'ESCALATED';
            const isInProgress = report.status === 'IN_PROGRESS';
            const isAssigned = report.status === 'ASSIGNED' || Boolean(report.assigned_crew);
            const hasEvidence = Boolean(report.resolution_photo_url || isResolved);

            // Determine active stage number for the standard 5-step timeline
            // 1: REPORT RECEIVED, 2: ASSIGNED, 3: WORK IN PROGRESS, 4: RESOLUTION EVIDENCE, 5: RESOLVED
            let activeStageNum = 1;
            if (isResolved) {
              activeStageNum = 5;
            } else if (hasEvidence) {
              activeStageNum = 4;
            } else if (isInProgress) {
              activeStageNum = 3;
            } else if (isAssigned) {
              activeStageNum = 2;
            }

            return (
              <div
                key={report.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 space-y-6 relative overflow-hidden"
              >
                {/* Visual Status Indicator Stripe */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isResolved
                      ? 'bg-[#10B981]'
                      : isEscalated
                      ? 'bg-[#EF4444]'
                      : isInProgress
                      ? 'bg-[#256BF5]'
                      : 'bg-[#FFC800]'
                  }`}
                />

                {/* =============================================================== */}
                {/* 6A. CARD HEADER: TICKET ID, PHOTO, ISSUE, WARD, STATUS, PRIORITY */}
                {/* =============================================================== */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail with Zoom button */}
                    <div
                      onClick={() =>
                        setActiveImageModal({
                          url: report.photo_url,
                          title: `Reported Drain: ${report.ticket_code}`,
                          caption: `Ward: ${report.ward} • ${report.landmark}`,
                        })
                      }
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 overflow-hidden border-2 border-slate-200 flex-shrink-0 relative group cursor-pointer shadow-xs"
                    >
                      {/* eslint-disable-next-html-element-suppression */}
                      <img
                        src={report.photo_url}
                        alt="Drainage incident"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Monospace Ticket ID */}
                        <span className="font-mono text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#256BF5] border border-blue-200">
                          {report.ticket_code}
                        </span>

                        {/* Current Status Badge */}
                        <span
                          className={`px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            isResolved
                              ? 'bg-emerald-100 text-[#10B981] border border-emerald-300'
                              : isEscalated
                              ? 'bg-red-100 text-[#EF4444] border border-red-300 animate-pulse'
                              : isInProgress
                              ? 'bg-blue-100 text-[#256BF5] border border-blue-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isResolved
                                ? 'bg-[#10B981]'
                                : isEscalated
                                ? 'bg-[#EF4444]'
                                : isInProgress
                                ? 'bg-[#256BF5]'
                                : 'bg-amber-500'
                            }`}
                          />
                          <span>{report.status.replace('_', ' ')}</span>
                        </span>

                        {/* Last update relative timestamp */}
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Updated {formatRelativeTime(report.updated_at || report.created_at)}</span>
                        </span>
                      </div>

                      {/* Issue title */}
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        {report.issue_type.replace(/_/g, ' ')}
                      </h3>

                      {/* Ward, Jurisdiction, Landmark */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-bold">
                        <span className="flex items-center gap-1 text-slate-900 font-black">
                          <MapPin className="w-3.5 h-3.5 text-[#EF4444]" />
                          Ward: {report.ward} (Ward #{report.ward_number})
                        </span>
                        <span>•</span>
                        <span className="text-[#256BF5] font-black flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {report.authority || 'Keralam Municipal Corporation'}
                        </span>
                        <span>•</span>
                        <span className="text-slate-500 font-medium truncate max-w-xs">
                          {report.landmark}
                        </span>
                      </div>

                      {/* Submission Date/Time */}
                      <div className="text-[11px] text-slate-500 font-medium">
                        Reported on: <strong className="text-slate-700">{formatDateTime(report.created_at)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Priority & SLA Card */}
                  <div className="flex flex-col items-end gap-1.5 text-right">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      NIRA Priority Score
                    </span>
                    <NIRAPriorityBadge score={report.priority_score} size="md" />

                    {/* Target SLA Pill */}
                    <div className="mt-1">
                      {isResolved ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>SLA Closed ({sla.limit}h window)</span>
                        </span>
                      ) : sla.isBreached ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-50 text-[#EF4444] border border-red-200 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-[#EF4444]" />
                          <span>SLA Breached ({sla.limit}h limit)</span>
                        </span>
                      ) : sla.isApproaching ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Approaching ({sla.remainingHours}h left)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-[#256BF5] border border-blue-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#256BF5]" />
                          <span>Target SLA: {sla.limit}h ({sla.remainingHours}h left)</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* =============================================================== */}
                {/* 6B. TIMELINE PROGRESSION: REPORT RECEIVED -> RESOLVED            */}
                {/*     PLUS ESCALATION BRANCH IF ESCALATED                         */}
                {/* =============================================================== */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#256BF5]" />
                      <span>Municipal Resolution Lifecycle</span>
                    </p>
                    <span className="text-[10px] font-bold text-slate-500">
                      Source of Truth: Central Authority Registry
                    </span>
                  </div>

                  {/* Standard 5-Step Workflow:
                      REPORT RECEIVED -> ASSIGNED -> WORK IN PROGRESS -> RESOLUTION EVIDENCE -> RESOLVED */}
                  <div className="grid grid-cols-5 gap-2 relative">
                    {[
                      { num: 1, label: 'REPORT RECEIVED', icon: Inbox, isDone: true, isActive: activeStageNum === 1 },
                      {
                        num: 2,
                        label: 'ASSIGNED',
                        icon: User,
                        isDone: activeStageNum >= 2,
                        isActive: activeStageNum === 2 && !isEscalated,
                      },
                      {
                        num: 3,
                        label: 'WORK IN PROGRESS',
                        icon: Wrench,
                        isDone: activeStageNum >= 3,
                        isActive: activeStageNum === 3 && !isEscalated,
                      },
                      {
                        num: 4,
                        label: 'RESOLUTION EVIDENCE',
                        icon: Camera,
                        isDone: activeStageNum >= 4,
                        isActive: activeStageNum === 4 && !isEscalated,
                      },
                      {
                        num: 5,
                        label: 'RESOLVED',
                        icon: CheckCircle2,
                        isDone: isResolved,
                        isActive: isResolved,
                      },
                    ].map((step, idx) => {
                      const StepIcon = step.icon;
                      return (
                        <div key={step.num} className="flex flex-col items-center text-center space-y-1.5">
                          {/* Connector line behind (handled by container or pill) */}
                          <div
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-xs transition-all relative ${
                              step.isDone
                                ? step.num === 5
                                  ? 'bg-[#10B981] text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-100'
                                  : 'bg-[#256BF5] text-white shadow-md shadow-blue-500/20'
                                : 'bg-white border-2 border-slate-200 text-slate-400'
                            } ${
                              step.isActive
                                ? step.num === 5
                                  ? 'ring-4 ring-emerald-300 animate-bounce'
                                  : 'ring-4 ring-blue-300 scale-105'
                                : ''
                            }`}
                          >
                            {step.isDone && !step.isActive ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : (
                              <StepIcon className="w-4 h-4" />
                            )}

                            {/* "Current Stage" pulse dot if active */}
                            {step.isActive && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#FFC800] border-2 border-white ring-2 ring-blue-400" />
                            )}
                          </div>

                          <span
                            className={`text-[9px] sm:text-[10px] font-black uppercase leading-tight ${
                              step.isActive
                                ? step.num === 5
                                  ? 'text-emerald-700'
                                  : 'text-[#256BF5]'
                                : step.isDone
                                ? 'text-slate-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </span>

                          {step.isActive && (
                            <span
                              className={`text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase ${
                                step.num === 5
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-[#256BF5]'
                              }`}
                            >
                              Current Stage
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* ============================================================= */}
                  {/* ESCALATION BRANCH (If Escalated or SLA Breached)              */}
                  {/* ============================================================= */}
                  {isEscalated && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-red-50 border-2 border-red-200 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-red-900 font-black text-xs">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-[#EF4444] animate-pulse" />
                          <span>ESCALATION BRANCH TRIGGERED:</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-[#EF4444] text-[10px] font-black uppercase">
                          SLA Breached & Escalated
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex-1 p-2 rounded-xl bg-white border border-red-200 text-center">
                          <span className="text-[10px] font-black text-[#EF4444] block">STAGE A</span>
                          <strong className="text-xs font-black text-slate-900">SLA BREACHED</strong>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Ticket exceeded {sla.limit}h standard SLA threshold
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                        <div className="flex-1 p-2 rounded-xl bg-red-600 text-white text-center shadow-md shadow-red-500/20">
                          <span className="text-[10px] font-black text-red-200 block">CURRENT STAGE</span>
                          <strong className="text-xs font-black text-white">ESCALATED TO AEE</strong>
                          <p className="text-[10px] text-red-100 mt-0.5">
                            Senior Executive Engineer intervention required
                          </p>
                        </div>
                      </div>

                      {report.escalated_reason && (
                        <div className="p-2.5 rounded-xl bg-white/80 border border-red-200 text-xs text-slate-700">
                          <strong className="text-[#EF4444] font-black">Official Escalation Reason:</strong>{' '}
                          <span className="font-medium text-slate-800">{report.escalated_reason}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* VISUAL ACTIVE STAGE EXPLANATION CALLOUT */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-3 text-xs">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black flex-shrink-0 ${
                        isResolved
                          ? 'bg-emerald-100 text-[#10B981]'
                          : isEscalated
                          ? 'bg-red-100 text-[#EF4444]'
                          : isInProgress
                          ? 'bg-blue-100 text-[#256BF5]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isResolved ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isEscalated ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : isInProgress ? (
                        <Truck className="w-4 h-4" />
                      ) : (
                        <Inbox className="w-4 h-4" />
                      )}
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900">
                          Current Stage:{' '}
                          {isResolved
                            ? 'RESOLVED (Verification Complete)'
                            : isEscalated
                            ? 'ESCALATED (Under Senior Municipal Review)'
                            : hasEvidence
                            ? 'RESOLUTION EVIDENCE (Validating Clearing Proof)'
                            : isInProgress
                            ? 'WORK IN PROGRESS (Crew Active On Site)'
                            : isAssigned
                            ? 'ASSIGNED (Dispatching Rapid Response Team)'
                            : 'REPORT RECEIVED (Awaiting Officer Assignment)'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Last Updated: {formatRelativeTime(report.updated_at || report.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-600 font-medium text-[11px] leading-relaxed">
                        {isResolved
                          ? 'The reported drainage blockage has been cleared, photographed, and verified. Water flow is restored.'
                          : isEscalated
                          ? 'This ticket was escalated due to prolonged obstruction or SLA breach. Heavy machinery suction jet units are being mobilized.'
                          : hasEvidence
                          ? 'Field crews have cleared the blockage and submitted photographic proof for municipal engineering clearance.'
                          : isInProgress
                          ? `Field crew ${report.assigned_crew || 'Quick Response Unit'} is currently on-site desilting and clearing the stormwater channel.`
                          : isAssigned
                          ? `Work order assigned to ${report.assigned_officer || 'Ward Assistant Engineer'}. Scheduled for rapid field clearance.`
                          : 'Ticket received by Keralam Municipal Corporation. AI categorization and ward routing complete.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* =============================================================== */}
                {/* 6C. FOR RESOLVED TICKETS: BEFORE/AFTER IMAGES, TIMESTAMP, PROOF  */}
                {/* =============================================================== */}
                {isResolved ? (
                  <div className="p-5 sm:p-6 rounded-3xl bg-emerald-50/70 border-2 border-emerald-200 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-[#10B981] text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-emerald-950">
                            Verified Resolution Evidence
                          </h4>
                          <p className="text-[11px] text-emerald-700 font-bold">
                            Official municipal resolution evidence validated by field engineering officers.
                          </p>
                        </div>
                      </div>

                      {/* Resolution Timestamp Badge */}
                      <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black border border-emerald-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>
                          Resolved on:{' '}
                          {report.resolved_at
                            ? formatDateTime(report.resolved_at)
                            : formatDateTime(report.updated_at)}
                        </span>
                      </div>
                    </div>

                    {/* BEFORE & AFTER PHOTO COMPARISON */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {/* Before Photo */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-black text-slate-700">
                          <span className="flex items-center gap-1 text-red-600">
                            <span>⚠️</span> BEFORE: Blocked drain
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {formatDateTime(report.created_at)}
                          </span>
                        </div>
                        <div
                          onClick={() =>
                            setActiveImageModal({
                              url: report.photo_url,
                              title: `Before Photo — Blocked Drain (${report.ticket_code})`,
                              caption: `Initial report: ${report.description}`,
                            })
                          }
                          className="w-full h-44 rounded-2xl bg-slate-200 overflow-hidden border border-slate-300 relative group cursor-pointer"
                        >
                          {/* eslint-disable-next-html-element-suppression */}
                          <img
                            src={report.photo_url}
                            alt="Before: Clogged Drain"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black gap-1">
                            <Maximize2 className="w-4 h-4" /> Click to enlarge
                          </div>
                        </div>
                      </div>

                      {/* After Photo */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-black text-emerald-800">
                          <span className="flex items-center gap-1 text-emerald-700">
                            <span>✓</span> AFTER: Cleared drain
                          </span>
                          <span className="text-emerald-600 font-mono text-[10px]">
                            {report.resolved_at
                              ? formatDateTime(report.resolved_at)
                              : formatDateTime(report.updated_at)}
                          </span>
                        </div>
                        <div
                          onClick={() =>
                            setActiveImageModal({
                              url: report.resolution_photo_url || report.photo_url,
                              title: `After Photo — Cleared Drain Evidence (${report.ticket_code})`,
                              caption: `Municipal resolution verified: ${report.resolution_notes || 'Drain cleared and desilted'}`,
                            })
                          }
                          className="w-full h-44 rounded-2xl bg-emerald-100 overflow-hidden border-2 border-emerald-400 relative group cursor-pointer shadow-xs"
                        >
                          {/* eslint-disable-next-html-element-suppression */}
                          <img
                            src={report.resolution_photo_url || report.photo_url}
                            alt="After: Cleared Drain Resolution Evidence"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black gap-1">
                            <Maximize2 className="w-4 h-4" /> Click to enlarge
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resolution Evidence Status & AI Verification */}
                    <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-black text-emerald-950">
                          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                          <span>Resolution Evidence Status:</span>
                          <span className="text-emerald-700 font-bold">
                            Verified with Before & After Photographic Proof
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                          Official KMC Sign-off
                        </span>
                      </div>

                      {report.resolution_ai_verification && (
                        <div className="pt-2 border-t border-emerald-100 flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-[#256BF5] flex-shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <strong className="text-slate-800 font-bold text-xs">
                                AI Resolution Check:
                              </strong>
                              <span className="text-[10px] text-slate-500 font-bold">
                                (AI-assisted prototype verification)
                              </span>
                            </div>
                            <p className="text-slate-800 font-bold text-xs">
                              &quot;{report.resolution_ai_verification.comparison_result}&quot;
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Official Public Resolution Notes (Citizen-safe, NOT internal notes) */}
                      {report.resolution_notes && (
                        <div className="pt-2 border-t border-emerald-100 flex items-start gap-2">
                          <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-500 font-bold block text-[10px] uppercase">
                              Municipal Field Clearance Summary:
                            </span>
                            <p className="text-slate-800 font-medium text-xs mt-0.5">
                              {report.resolution_notes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* =============================================================== */
                  /* 6D. FOR ACTIVE TICKETS: RESPONSIBLE WARD, AUTHORITY STATUS, SLA */
                  /* =============================================================== */
                  <div className="p-5 rounded-3xl bg-blue-50/60 border border-blue-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-slate-900 text-xs">
                        <Building2 className="w-4 h-4 text-[#256BF5]" />
                        <span>Active Municipal Dispatch Information</span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-[#256BF5] bg-blue-100 px-2 py-0.5 rounded-md">
                        Live Tracking
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* Responsible Ward Card */}
                      <div className="p-3.5 rounded-2xl bg-white border border-blue-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Responsible Ward & Zone
                        </span>
                        <strong className="text-slate-900 font-black block text-xs">
                          Ward {report.ward_number}: {report.ward}
                        </strong>
                        <p className="text-[11px] text-slate-600 font-medium">
                          {report.authority || 'Keralam Municipal Corporation'}
                        </p>
                      </div>

                      {/* Current Authority Status */}
                      <div className="p-3.5 rounded-2xl bg-white border border-blue-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Current Authority Status
                        </span>
                        <strong className="text-slate-900 font-black block text-xs">
                          {report.assigned_crew
                            ? `Crew Dispatched (${report.assigned_crew})`
                            : report.assigned_officer
                            ? `Assigned to ${report.assigned_officer}`
                            : 'Queued in Ward Dispatch System'}
                        </strong>
                        <p className="text-[11px] text-slate-600 font-medium">
                          {report.status === 'IN_PROGRESS'
                            ? 'Clearance under active field execution'
                            : 'Field team scheduled for dispatch'}
                        </p>
                      </div>

                      {/* SLA Status Card */}
                      <div className="p-3.5 rounded-2xl bg-white border border-blue-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          SLA Compliance Status
                        </span>
                        <strong
                          className={`block text-xs font-black ${
                            sla.isBreached
                              ? 'text-[#EF4444]'
                              : sla.isApproaching
                              ? 'text-amber-800'
                              : 'text-[#256BF5]'
                          }`}
                        >
                          {sla.isBreached
                            ? `Breached (+${(sla.elapsedHours - sla.limit).toFixed(1)}h Overdue)`
                            : `${sla.remainingHours} Hours Remaining`}
                        </strong>
                        <p className="text-[11px] text-slate-600 font-medium">
                          Target window: {sla.limit}h from submission
                        </p>
                      </div>
                    </div>

                    {/* Latest Update Banner */}
                    <div className="p-3 rounded-xl bg-white border border-blue-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#256BF5]" />
                        <span className="font-bold text-slate-700">Latest Municipal Update:</span>
                        <span className="font-medium text-slate-600">
                          {report.status === 'IN_PROGRESS'
                            ? 'Crew deployed with desilting suction units at location.'
                            : report.assigned_crew
                            ? `Assigned to ${report.assigned_crew} for immediate clearance.`
                            : 'Report verified and registered in Ward Engineering queue.'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold whitespace-nowrap ml-2">
                        {formatDateTime(report.updated_at || report.created_at)}
                      </span>
                    </div>
                  </div>
                )}

                {/* =============================================================== */}
                {/* 6E. PRIVACY GUARANTEE: STRICTLY NO INTERNAL NOTES EXPOSED       */}
                {/* =============================================================== */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>
                      Civic Privacy Assured • Official Municipal Transparency System • Internal officer dispatch logs protected
                    </span>
                  </div>
                  <span className="font-mono text-slate-400">
                    Coords: ~{report.lat.toFixed(3)}°N, ~{report.lng.toFixed(3)}°E
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* =================================================================== */}
      {/* 7. IMAGE LIGHTBOX MODAL                                             */}
      {/* =================================================================== */}
      {activeImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveImageModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-4 p-4 sm:p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-black text-slate-900">{activeImageModal.title}</h4>
              <button
                onClick={() => setActiveImageModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full max-h-[60vh] rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
              {/* eslint-disable-next-html-element-suppression */}
              <img
                src={activeImageModal.url}
                alt="Enlarged view"
                className="w-full h-full object-contain max-h-[60vh]"
              />
            </div>

            {activeImageModal.caption && (
              <p className="text-xs text-slate-600 font-medium text-center">
                {activeImageModal.caption}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveImageModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
