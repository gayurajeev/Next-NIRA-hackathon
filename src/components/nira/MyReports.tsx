'use client';

import React, { useState, useMemo } from 'react';
import { DrainageReport } from '@/lib/niraTypes';
import { NIRAPriorityBadge } from './NIRAPriorityBadge';
import { evaluateSla } from '@/lib/slaEngine';
import {
  MapPin,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  AlertTriangle,
  Maximize2,
  X,
  Building2,
  Check,
  Wrench,
  Camera,
  Inbox,
  User,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
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
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
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

  const toggleExpand = (id: string) => {
    setExpandedReportId(prev => (prev === id ? null : id));
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

  // SLA Calculation Helper
  const getSlaInfo = (report: DrainageReport) => {
    const sla = evaluateSla(report);
    return {
      limit: sla.slaLimitHours,
      elapsedHours: Math.round(sla.elapsedHours * 10) / 10,
      remainingHours: Math.round(sla.remainingHours * 10) / 10,
      isBreached: sla.isBreached,
      isApproaching: sla.isApproaching,
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
      if (filterStatus === 'OPEN') {
        if (rep.status !== 'OPEN' && rep.status !== 'ASSIGNED') return false;
      } else if (filterStatus !== 'ALL') {
        if (rep.status !== filterStatus) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = rep.ticket_code.toLowerCase().includes(query);
        const matchesWard = rep.ward.toLowerCase().includes(query);
        const matchesIssue = rep.issue_type.toLowerCase().includes(query);
        const matchesLandmark = rep.landmark?.toLowerCase().includes(query);
        if (!matchesCode && !matchesWard && !matchesIssue && !matchesLandmark) {
          return false;
        }
      }

      return true;
    });
  }, [reports, filterStatus, searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* =================================================================== */}
      {/* 1. HEADER & SEARCH / FILTER CONTROLS                                */}
      {/* =================================================================== */}
      <div className="space-y-4 pb-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              My Submitted Reports
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Track resolution progress and view verified before/after photos.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onRefresh && (
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing || isLoading}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                title="Refresh reports"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin text-[#256BF5]' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}

            {onNavigateToReport && (
              <button
                onClick={onNavigateToReport}
                className="px-4 py-2 rounded-xl bg-[#256BF5] hover:bg-blue-600 text-white font-black text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              >
                <span>+ Report Issue</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills & Search Bar (Clean & Responsive) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto no-scrollbar">
            {[
              { key: 'ALL', label: 'All', count: counts.ALL },
              { key: 'OPEN', label: 'Under Review', count: counts.OPEN },
              { key: 'IN_PROGRESS', label: 'In Progress', count: counts.IN_PROGRESS },
              { key: 'RESOLVED', label: 'Cleaned', count: counts.RESOLVED },
              { key: 'ESCALATED', label: 'Escalated', count: counts.ESCALATED },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  filterStatus === tab.key
                    ? tab.key === 'RESOLVED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : tab.key === 'ESCALATED'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-[#256BF5] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    filterStatus === tab.key
                      ? 'bg-black/20 text-white font-bold'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-60 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ward, issue, ID..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#256BF5] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Unable to load reports</p>
            <p className="text-slate-600 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div
              key={i}
              className="bg-white rounded-3xl p-5 border border-slate-200 animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-10 bg-slate-100 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        /* Empty State */
        reports.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border-2 border-dashed border-slate-200 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#256BF5] flex items-center justify-center mx-auto">
              <Inbox className="w-7 h-7" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="text-lg font-black text-slate-900">No Reports Yet</h3>
              <p className="text-xs text-slate-600 font-medium">
                You haven&apos;t reported any clogged drains. Spot standing water or blocked drains in your neighborhood?
              </p>
            </div>
            {onNavigateToReport && (
              <button
                onClick={onNavigateToReport}
                className="px-6 py-2.5 rounded-2xl bg-[#256BF5] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Report a Drain Issue</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-2">
            <Search className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No matching reports found</h4>
            <p className="text-xs text-slate-500">
              Try adjusting your filter or search query.
            </p>
          </div>
        )
      ) : (
        /* =================================================================== */
        /* REPORT CARDS (SIMPLIFIED & FULLY RESPONSIVE)                         */
        /* =================================================================== */
        <div className="space-y-4">
          {filteredReports.map(report => {
            const sla = getSlaInfo(report);
            const isResolved = report.status === 'RESOLVED';
            const isEscalated = report.status === 'ESCALATED';
            const isInProgress = report.status === 'IN_PROGRESS';
            const isAssigned = report.status === 'ASSIGNED' || Boolean(report.assigned_crew);
            const isExpanded = expandedReportId === report.id;

            // Step number from 1 to 4
            let stepNum = 1;
            let stepLabel = 'Report Received';
            if (isResolved) {
              stepNum = 4;
              stepLabel = 'Cleaned & Verified';
            } else if (isInProgress) {
              stepNum = 3;
              stepLabel = 'Crew On-Site';
            } else if (isAssigned) {
              stepNum = 2;
              stepLabel = 'Ward Assigned';
            }

            return (
              <div
                key={report.id}
                className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs hover:shadow-sm transition-all space-y-4"
              >
                {/* 1. TOP BAR: Photo, Title, Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Photo Thumbnail */}
                    <div
                      onClick={() =>
                        setActiveImageModal({
                          url: report.photo_url,
                          title: `Drain Report: ${report.ticket_code}`,
                          caption: `Ward ${report.ward_number} (${report.ward}) • ${report.landmark}`,
                        })
                      }
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0 relative group cursor-pointer"
                    >
                      <img
                        src={report.photo_url}
                        alt="Drain report photo"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Title & Metadata */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#256BF5] border border-blue-100">
                          {report.ticket_code}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatRelativeTime(report.created_at)}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
                        {report.issue_type.replace(/_/g, ' ')}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="font-bold text-slate-800 truncate">
                          Ward {report.ward_number} ({report.ward})
                        </span>
                        {report.landmark && (
                          <span className="text-slate-400 hidden sm:inline truncate">
                            • {report.landmark}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status & Priority Badge */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : isEscalated
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : isInProgress
                          ? 'bg-blue-100 text-[#256BF5] border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isResolved
                            ? 'bg-emerald-600'
                            : isEscalated
                            ? 'bg-red-600'
                            : isInProgress
                            ? 'bg-[#256BF5]'
                            : 'bg-amber-500'
                        }`}
                      />
                      <span>{report.status.replace('_', ' ')}</span>
                    </span>

                    <NIRAPriorityBadge score={report.priority_score} size="sm" />
                  </div>
                </div>

                {/* 2. RESPONSIVE PROGRESS TRACKER */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  {/* Mobile View: Clean, uncluttered progress bar + current step pill */}
                  <div className="sm:hidden space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">Progress:</span>
                      <span className="text-[#256BF5] font-black">{stepLabel}</span>
                    </div>
                    {/* Linear Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        style={{ width: `${(stepNum / 4) * 100}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          isResolved ? 'bg-emerald-500' : isEscalated ? 'bg-red-500' : 'bg-[#256BF5]'
                        }`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                      <span>Reported</span>
                      <span>Assigned</span>
                      <span>In Progress</span>
                      <span>Cleaned</span>
                    </div>
                  </div>

                  {/* Desktop View: Clean 4-step stepper */}
                  <div className="hidden sm:grid grid-cols-4 gap-2 text-center">
                    {[
                      { num: 1, label: 'Reported', icon: Inbox, isDone: true, isCurrent: stepNum === 1 },
                      { num: 2, label: 'Ward Assigned', icon: User, isDone: stepNum >= 2, isCurrent: stepNum === 2 },
                      { num: 3, label: 'In Progress', icon: Wrench, isDone: stepNum >= 3, isCurrent: stepNum === 3 },
                      { num: 4, label: 'Cleaned', icon: CheckCircle2, isDone: isResolved, isCurrent: isResolved },
                    ].map(step => {
                      const StepIcon = step.icon;
                      return (
                        <div key={step.num} className="flex flex-col items-center space-y-1">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              step.isCurrent
                                ? isResolved
                                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-200'
                                  : 'bg-[#256BF5] text-white ring-2 ring-blue-200'
                                : step.isDone
                                ? 'bg-blue-100 text-[#256BF5]'
                                : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            {step.isDone && !step.isCurrent ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <StepIcon className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span
                            className={`text-[11px] font-bold ${
                              step.isCurrent
                                ? 'text-slate-900 font-black'
                                : step.isDone
                                ? 'text-slate-700'
                                : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Status explanation */}
                  <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 font-medium">
                    {isResolved ? (
                      <p className="text-emerald-700 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Drain cleared and verified with photographic evidence.</span>
                      </p>
                    ) : isEscalated ? (
                      <p className="text-red-700 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>Escalated for senior engineering crew intervention.</span>
                      </p>
                    ) : isInProgress ? (
                      <p className="text-[#256BF5] font-bold flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-[#256BF5] shrink-0" />
                        <span>Response crew {report.assigned_crew ? `(${report.assigned_crew}) ` : ''}is currently on-site clearing the blockage.</span>
                      </p>
                    ) : (
                      <p className="text-slate-600 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Ticket routed to {report.assigned_officer || `Ward ${report.ward_number} Officer`}. Scheduled for clearance.</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. RESOLUTION PROOF (Only shown if resolved or has proof) */}
                {isResolved && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Verified Before & After Photos</span>
                      </span>
                      {report.resolved_at && (
                        <span className="text-[10px] font-bold text-emerald-700">
                          {formatDateTime(report.resolved_at)}
                        </span>
                      )}
                    </div>

                    {/* Before & After Images (Responsive Grid) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Before Photo */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-red-600 uppercase block">
                          Before (Blocked)
                        </span>
                        <div
                          onClick={() =>
                            setActiveImageModal({
                              url: report.photo_url,
                              title: `Before: ${report.ticket_code}`,
                              caption: report.description,
                            })
                          }
                          className="w-full h-36 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 relative group cursor-pointer"
                        >
                          <img
                            src={report.photo_url}
                            alt="Before clearing"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                            Enlarge
                          </div>
                        </div>
                      </div>

                      {/* After Photo */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                          After (Cleared Proof)
                        </span>
                        <div
                          onClick={() =>
                            setActiveImageModal({
                              url: report.resolution_photo_url || report.photo_url,
                              title: `After: ${report.ticket_code}`,
                              caption: report.resolution_notes || 'Drain cleared and desilted',
                            })
                          }
                          className="w-full h-36 rounded-xl overflow-hidden bg-emerald-100 border border-emerald-300 relative group cursor-pointer"
                        >
                          <img
                            src={report.resolution_photo_url || report.photo_url}
                            alt="After clearing proof"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                            Enlarge
                          </div>
                        </div>
                      </div>
                    </div>

                    {report.resolution_notes && (
                      <p className="text-xs text-slate-700 font-medium pt-1">
                        <strong className="text-emerald-900">Work Notes:</strong> {report.resolution_notes}
                      </p>
                    )}
                  </div>
                )}

                {/* 4. EXPANDABLE DETAILS ACCORDION (Keeps main card clean) */}
                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => toggleExpand(report.id)}
                    className="w-full py-1.5 flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Details' : 'View Full Details'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="pt-3 space-y-3 text-xs border-t border-slate-100 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 font-medium">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Responsible Authority</span>
                          <span className="font-bold text-slate-800">{report.authority || 'Keralam Municipal Corporation'}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Assigned Officer</span>
                          <span className="font-bold text-slate-800">{report.assigned_officer || 'Ward Assistant Engineer'}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Reported Time</span>
                          <span className="font-bold text-slate-800">{formatDateTime(report.created_at)}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Response Target</span>
                          <span className="font-bold text-slate-800">Within {sla.limit} hours</span>
                        </div>
                      </div>

                      {report.description && (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                          <strong className="text-slate-900 block text-[10px] uppercase mb-0.5">Problem Description:</strong>
                          <p>{report.description}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Verified Municipal Record • Location ~{report.lat.toFixed(3)}°N, ~{report.lng.toFixed(3)}°E</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {activeImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveImageModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-4 sm:p-6 space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-900 truncate">{activeImageModal.title}</h4>
              <button
                onClick={() => setActiveImageModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full max-h-[55vh] rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
              <img
                src={activeImageModal.url}
                alt="Enlarged view"
                className="w-full h-full object-contain max-h-[55vh]"
              />
            </div>

            {activeImageModal.caption && (
              <p className="text-xs text-slate-600 font-medium text-center">
                {activeImageModal.caption}
              </p>
            )}

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setActiveImageModal(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
