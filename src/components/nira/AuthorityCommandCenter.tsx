'use client';

import React, { useState, useRef, useMemo } from 'react';
import { DrainageReport, HotspotCluster, ReportStatus, SeverityLevel } from '@/lib/niraTypes';
import { niraService } from '@/lib/niraService';
import { NIRAPriorityBadge } from './NIRAPriorityBadge';
import { IncidentSidePanel } from './IncidentSidePanel';
import { ResolutionEvidenceModal } from './ResolutionEvidenceModal';
import { useAuth } from '@/lib/authContext';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Flame,
  Filter,
  MapPin,
  Building2,
  Clock,
  UploadCloud,
  Check,
  X,
  Users,
  AlertCircle,
  Eye,
  Search,
  AlertOctagon,
  ArrowRight,
  Activity,
  CheckCircle2,
  FileCheck,
  Timer,
  FastForward,
  RotateCcw,
  Zap,
} from 'lucide-react';
import {
  evaluateSla,
  escalateReportOnBreach,
  getSlaLimitHours,
  formatDurationHoursMinutes,
} from '@/lib/slaEngine';

interface AuthorityCommandCenterProps {
  reports: DrainageReport[];
  hotspots: HotspotCluster[];
  onReportUpdated: (updatedReport: DrainageReport) => void;
  onOpenAuthModal?: () => void;
}

const AVAILABLE_CREWS = [
  'KMC Rapid Desilting Jet Crew 04 (Vyttila Hub)',
  'KMC Suction Jet Unit 02 (Kadavanthra Canal)',
  'Ward 12 Heritage Trench Squad (Fort Kochi)',
  'Ward 40 Heavy Culvert Excavation Team (Edappally)',
  'Ward 28 Sanitation Emergency Unit (Kaloor)',
];

const SAMPLE_RESOLUTION_PHOTOS = [
  {
    label: 'Cleared Culvert & Jet Flow Restored',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Desilted Silt Trap & Unclogged Grate',
    url: 'https://images.unsplash.com/photo-1590059301072-a162235c5c0d?auto=format&fit=crop&w=800&q=80',
  },
];

type KpiFilter =
  | 'ALL'
  | 'ATTENTION_NOW'
  | 'OPEN'
  | 'HIGH_CRITICAL'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'BREACHED'
  | 'APPROACHING_SLA';

export const AuthorityCommandCenter: React.FC<AuthorityCommandCenterProps> = ({
  reports,
  hotspots,
  onReportUpdated,
  onOpenAuthModal,
}) => {
  const { user, signInAuthority } = useAuth();
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'priority' | 'sla' | 'newest'>('priority');

  // Selected Ticket for Slide-Over Detailed Side Panel
  const [selectedTicket, setSelectedTicket] = useState<DrainageReport | null>(null);

  // Quick action modals
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [crewModalReport, setCrewModalReport] = useState<DrainageReport | null>(null);
  const [selectedCrew, setSelectedCrew] = useState<string>(AVAILABLE_CREWS[0]);

  const [resolutionModalReport, setResolutionModalReport] = useState<DrainageReport | null>(null);
  const [resolutionPhotoUrl, setResolutionPhotoUrl] = useState<string>(SAMPLE_RESOLUTION_PHOTOS[0].url);
  const [resolutionNotes, setResolutionNotes] = useState<string>(
    'Drain cleared using high-pressure jetting and suction pump. Water flow fully restored.'
  );
  const [isUploadingResolution, setIsUploadingResolution] = useState<boolean>(false);
  const resolutionFileInputRef = useRef<HTMLInputElement>(null);

  const [escalationModalReport, setEscalationModalReport] = useState<DrainageReport | null>(null);
  const [escalationReason, setEscalationReason] = useState<string>(
    'SLA Breached: Stalled over allowable time during active monsoon downpour. Requires Assistant Executive Engineer intervention.'
  );

  const isAuthority = user?.role === 'GOVERNMENT';

  // Demo Clock Offset (manipulates simulated time rather than user system clock)
  const [demoClockOffsetHours, setDemoClockOffsetHours] = useState<number>(0);
  const simulatedNowMs = Date.now() + demoClockOffsetHours * 3600 * 1000;

  // SLA Calculation Helper using robust SLA Engine
  const getSlaInfo = (report: DrainageReport) => {
    const evaluation = evaluateSla(report, simulatedNowMs);
    const overdueHours = Math.max(0, evaluation.elapsedHours - evaluation.slaLimitHours);
    return {
      limit: evaluation.slaLimitHours,
      slaLimitHours: evaluation.slaLimitHours,
      elapsedHours: evaluation.elapsedHours,
      remaining: evaluation.remainingHours,
      remainingHours: evaluation.remainingHours,
      elapsedFormatted: evaluation.elapsedFormatted,
      remainingFormatted: evaluation.remainingFormatted,
      isBreached: evaluation.isBreached,
      isApproaching: evaluation.isApproaching,
      slaState: evaluation.slaState,
      currentAuthorityLevel: evaluation.currentAuthorityLevel,
      nextAuthorityLevel: evaluation.nextAuthorityLevel,
      remainingDisplay: evaluation.isBreached
        ? `Breached (+${formatDurationHoursMinutes(overdueHours)})`
        : `${evaluation.remainingFormatted} left`,
    };
  };

  // Trigger Demo SLA Breach Action
  const handleTriggerSlaBreach = () => {
    const activeReports = reports.filter(r => r.status !== 'RESOLVED');
    if (activeReports.length === 0) return;

    // Pick critical/high report if available, else first active report
    const target =
      activeReports.find(r => (r.severity === 'CRITICAL' || r.severity === 'HIGH') && r.status !== 'ESCALATED') ||
      activeReports.find(r => r.status !== 'ESCALATED') ||
      activeReports[0];

    const targetSla = getSlaLimitHours(target.severity);
    const createdAtMs = new Date(target.created_at).getTime();
    const currentElapsed = (simulatedNowMs - createdAtMs) / (3600 * 1000);
    const advanceNeeded = Math.max(demoClockOffsetHours + 4, Math.ceil(targetSla - currentElapsed + 1.2) + demoClockOffsetHours);

    setDemoClockOffsetHours(advanceNeeded);
    const newSimulatedTimeMs = Date.now() + advanceNeeded * 3600 * 1000;

    const escalatedTicket = escalateReportOnBreach(target, {
      simulatedCurrentTimeMs: newSimulatedTimeMs,
      customReason: `SLA BREACHED: Ticket elapsed ${formatDurationHoursMinutes(targetSla + 1.2)} (allowable SLA: ${targetSla}h). Escalated from Ward Response Team to Supervisory Officer (Assistant Executive Engineer).`,
    });

    onReportUpdated(escalatedTicket);
    setSelectedTicket(escalatedTicket);
  };

  // Relative Age Helper with simulated clock support
  const formatAge = (dateStr: string): string => {
    try {
      const diffMs = simulatedNowMs - new Date(dateStr).getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 60) return `${Math.max(1, mins)}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return 'Recently';
    }
  };

  // Operational Questions Metrics Calculation
  const attentionNowReports = useMemo(() => {
    return reports.filter(
      r =>
        r.status !== 'RESOLVED' &&
        (r.priority_score >= 70 || r.severity === 'CRITICAL' || r.severity === 'HIGH') &&
        (!r.assigned_crew || r.status === 'OPEN')
    );
  }, [reports]);

  const approachingSlaReports = useMemo(() => {
    return reports.filter(r => {
      const sla = getSlaInfo(r);
      return sla.isApproaching;
    });
  }, [reports]);

  const breachedReports = useMemo(() => {
    return reports.filter(r => getSlaInfo(r).isBreached || r.status === 'ESCALATED');
  }, [reports]);

  // Find top problematic ward
  const topProblemWard = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      if (r.status !== 'RESOLVED') {
        counts[r.ward] = (counts[r.ward] || 0) + 1;
      }
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] || ['Vyttila', 0];
  }, [reports]);

  // 6 Core Municipal KPIs
  const totalReportsCount = reports.length;
  const openReportsCount = reports.filter(r => r.status === 'OPEN').length;
  const highCriticalCount = reports.filter(
    r => r.priority_score >= 70 || r.severity === 'HIGH' || r.severity === 'CRITICAL'
  ).length;
  const inProgressCount = reports.filter(
    r => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED'
  ).length;
  const resolvedCount = reports.filter(r => r.status === 'RESOLVED').length;
  const slaBreachesCount = reports.filter(r => getSlaInfo(r).isBreached).length;

  // Filtered and Sorted Reports
  const filteredReports = useMemo(() => {
    return reports
      .filter(r => {
        // Ward filter
        if (selectedWard !== 'ALL' && !r.ward.toLowerCase().includes(selectedWard.toLowerCase())) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTicket = r.ticket_code.toLowerCase().includes(q);
          const matchIssue = r.issue_type.toLowerCase().includes(q);
          const matchWard = r.ward.toLowerCase().includes(q);
          const matchLandmark = r.landmark.toLowerCase().includes(q);
          const matchOfficer = (r.assigned_crew || r.assigned_officer || '').toLowerCase().includes(q);
          if (!matchTicket && !matchIssue && !matchWard && !matchLandmark && !matchOfficer) {
            return false;
          }
        }

        // KPI Filter
        if (kpiFilter === 'OPEN') return r.status === 'OPEN';
        if (kpiFilter === 'HIGH_CRITICAL') {
          return r.priority_score >= 70 || r.severity === 'HIGH' || r.severity === 'CRITICAL';
        }
        if (kpiFilter === 'IN_PROGRESS') {
          return r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED';
        }
        if (kpiFilter === 'RESOLVED') return r.status === 'RESOLVED';
        if (kpiFilter === 'BREACHED') return getSlaInfo(r).isBreached || r.status === 'ESCALATED';
        if (kpiFilter === 'ATTENTION_NOW') {
          return (
            r.status !== 'RESOLVED' &&
            (r.priority_score >= 70 || r.severity === 'CRITICAL' || r.severity === 'HIGH') &&
            (!r.assigned_crew || r.status === 'OPEN')
          );
        }
        if (kpiFilter === 'APPROACHING_SLA') {
          return getSlaInfo(r).isApproaching;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          return b.priority_score - a.priority_score;
        }
        if (sortBy === 'sla') {
          const slaA = getSlaInfo(a).remaining;
          const slaB = getSlaInfo(b).remaining;
          return slaA - slaB;
        }
        // Newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [reports, selectedWard, kpiFilter, searchQuery, sortBy]);

  // Action: Crew Assignment Modal Submit
  const handleConfirmAssignCrew = async () => {
    if (!crewModalReport) return;
    setUpdatingId(crewModalReport.id);
    try {
      await niraService.updateReportStatus(crewModalReport.id, 'ASSIGNED', {
        assignedCrew: selectedCrew,
        assignedOfficer: selectedCrew,
      });

      const updatedObj: DrainageReport = {
        ...crewModalReport,
        status: 'ASSIGNED',
        assigned_officer: selectedCrew,
        assigned_crew: selectedCrew,
        updated_at: new Date().toISOString(),
      };

      onReportUpdated(updatedObj);
      if (selectedTicket?.id === crewModalReport.id) {
        setSelectedTicket(updatedObj);
      }
      setCrewModalReport(null);
    } catch (e) {
      console.error('Failed to assign crew:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Action: Resolution File Upload
  const handleResolutionFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingResolution(true);
    try {
      const uploadedUrl = await niraService.uploadDrainagePhoto(file);
      setResolutionPhotoUrl(uploadedUrl);
    } catch (err) {
      console.error('Failed uploading resolution evidence:', err);
    } finally {
      setIsUploadingResolution(false);
    }
  };

  // Action: Confirm Resolution
  const handleConfirmResolve = async () => {
    if (!resolutionModalReport) return;
    setUpdatingId(resolutionModalReport.id);
    const now = new Date().toISOString();

    try {
      await niraService.updateReportStatus(resolutionModalReport.id, 'RESOLVED', {
        resolutionPhotoUrl,
        resolutionNotes,
      });

      const updatedObj: DrainageReport = {
        ...resolutionModalReport,
        status: 'RESOLVED',
        resolution_photo_url: resolutionPhotoUrl,
        resolution_notes: resolutionNotes,
        resolved_at: now,
        updated_at: now,
      };

      onReportUpdated(updatedObj);
      if (selectedTicket?.id === resolutionModalReport.id) {
        setSelectedTicket(updatedObj);
      }
      setResolutionModalReport(null);
    } catch (e) {
      console.error('Failed to resolve report:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Action: Confirm Escalation
  const handleConfirmEscalate = async () => {
    if (!escalationModalReport) return;
    setUpdatingId(escalationModalReport.id);
    try {
      await niraService.updateReportStatus(escalationModalReport.id, 'ESCALATED', {
        escalatedReason: escalationReason,
      });

      const updatedObj: DrainageReport = {
        ...escalationModalReport,
        status: 'ESCALATED',
        escalated_reason: escalationReason,
        updated_at: new Date().toISOString(),
      };

      onReportUpdated(updatedObj);
      if (selectedTicket?.id === escalationModalReport.id) {
        setSelectedTicket(updatedObj);
      }
      setEscalationModalReport(null);
    } catch (e) {
      console.error('Failed to escalate report:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-[#256BF5]" />
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Keralam Municipal Command Center
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Drainage Operations, Live SLA Monitoring, Hotspot Clusters & Rapid Crew Dispatch
          </p>
        </div>

        {/* Authority Login Quick Access */}
        <div className="flex items-center gap-3">
          {!isAuthority ? (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl text-xs">
              <span className="font-bold text-amber-900">
                Municipal Portal: <strong className="font-mono">admin@nira.in</strong>
              </span>
              <button
                type="button"
                onClick={() =>
                  onOpenAuthModal ? onOpenAuthModal() : signInAuthority('admin@nira.in', 'nira@123')
                }
                className="px-3.5 py-1.5 rounded-xl bg-[#FFC800] hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs transition-all flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Officer Log In</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl text-xs font-bold text-emerald-800">
              <CheckCircle className="w-4 h-4 text-[#10B981]" />
              <span>Logged in as Municipal Authority ({user?.email})</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1B. SLA & ESCALATION DEMO CONTROLS (AUTHENTICATED AUTHORITY DASHBOARD ONLY) */}
      {/* ========================================================================= */}
      {isAuthority && (
        <div className="p-5 rounded-3xl bg-amber-50/90 border-2 border-amber-300 space-y-3 shadow-xs animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#FFC800] text-slate-950 flex items-center justify-center font-black shadow-xs">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 tracking-tight">
                  SLA Engine Demo Controls (Simulation Sandbox)
                </h4>
                <p className="text-xs text-slate-600 font-medium">
                  Test time-based SLA thresholds (High/Crit: 4h, Med: 8h, Low: 24h) and trigger automated supervisory escalations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black px-3 py-1 rounded-xl bg-white border border-amber-200 text-amber-900 shadow-2xs">
                Simulated Offset: +{demoClockOffsetHours}h ({new Date(simulatedNowMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            </div>
          </div>

          {/* Action Buttons: +1h, +4h, +8h, Trigger SLA breach */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setDemoClockOffsetHours(prev => prev + 1)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-slate-900 text-xs font-black shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <FastForward className="w-3.5 h-3.5 text-amber-600" />
              <span>+1 hour</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoClockOffsetHours(prev => prev + 4)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-slate-900 text-xs font-black shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <FastForward className="w-3.5 h-3.5 text-amber-600" />
              <span>+4 hours</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoClockOffsetHours(prev => prev + 8)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-slate-900 text-xs font-black shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <FastForward className="w-3.5 h-3.5 text-amber-600" />
              <span>+8 hours</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerSlaBreach}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md shadow-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-[#FFC800]" />
              <span>Trigger SLA breach</span>
            </button>

            {demoClockOffsetHours > 0 && (
              <button
                type="button"
                onClick={() => setDemoClockOffsetHours(0)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset (0h)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1C. SLA BREACHED WARNING CALLOUT (VISIBLE WARNING IN COMMAND CENTER)      */}
      {/* ========================================================================= */}
      {breachedReports.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-red-50 border-2 border-red-300 text-red-950 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#EF4444] text-white flex items-center justify-center font-black shadow-md shadow-red-500/20">
                <AlertOctagon className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-red-950 uppercase tracking-tight">
                    SLA BREACHED — SUPERVISORY ESCALATION REQUIRED
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase">
                    Level 2 Intercept
                  </span>
                </div>
                <p className="text-xs text-red-800 font-medium mt-0.5">
                  The following active ticket(s) have exceeded allowable municipal SLA response windows without verified resolution.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-black text-red-700 bg-red-100 px-3 py-1 rounded-xl border border-red-200">
              {breachedReports.length} Breached / Escalated
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {breachedReports.slice(0, 2).map(rep => {
              const sla = getSlaInfo(rep);
              return (
                <div
                  key={rep.id}
                  className="p-4 rounded-2xl bg-white border-2 border-red-200 shadow-xs space-y-3"
                >
                  <div className="flex justify-between items-center border-b border-red-100 pb-2">
                    <span className="font-mono font-black text-[#256BF5] text-sm">{rep.ticket_code}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-black text-[10px] uppercase animate-pulse">
                      SLA BREACHED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">Ward:</span>
                      <strong className="text-slate-900 font-black">{rep.ward} (Ward #{rep.ward_number})</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">Elapsed vs SLA:</span>
                      <strong className="text-red-600 font-black">
                        Elapsed: {sla.elapsedFormatted} • SLA: {sla.slaLimitHours}h
                      </strong>
                    </div>
                  </div>

                  {/* Formatted Escalation Levels: Level 1 -> Level 2 */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">
                      Escalation Routing:
                    </span>
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span className="text-slate-600">Level 1 → Ward Response Team</span>
                      <ArrowRight className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                      <span className="text-red-700 font-black">Level 2 → Supervisory Officer</span>
                    </div>
                    <p className="text-[10px] text-slate-500 italic mt-1">
                      Assigned: {rep.assigned_officer || 'Assistant Executive Engineer (AEE - Central Operations)'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTicket(rep)}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Inspect Diagnostic Panel & Direct Crew</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-500 italic">
            * Prototype operational SLA model — Demonstrates automated administrative escalation. Does not claim connection to actual statutory KMC proceedings unless formally integrated.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. THE FOUR IMMEDIATE OPERATIONAL QUESTIONS (TRIAGE MATRIX)               */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#256BF5]" /> Executive Operational Triage
          </h3>
          <span className="text-[11px] font-bold text-slate-600">
            Live municipal status answering critical dispatch needs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Question 1: What needs attention now? */}
          <div
            onClick={() => setKpiFilter(kpiFilter === 'ATTENTION_NOW' ? 'ALL' : 'ATTENTION_NOW')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative ${
              kpiFilter === 'ATTENTION_NOW'
                ? 'bg-amber-50/80 border-[#FFC800] ring-4 ring-amber-300/40 shadow-md'
                : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                1. Needs Attention Now
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                {attentionNowReports.length}
              </div>
              <p className="text-xs text-slate-600 font-bold mt-1 leading-snug">
                {attentionNowReports.length > 0
                  ? `${attentionNowReports.length} high/critical tickets unassigned or awaiting crew dispatch.`
                  : 'All critical blockages currently assigned to active squads.'}
              </p>
            </div>
            <div className="mt-3 text-[10px] font-black text-[#256BF5] flex items-center gap-1">
              <span>{kpiFilter === 'ATTENTION_NOW' ? 'Filtering active' : 'Click to filter queue'}</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* Question 2: Where are the problems? */}
          <div
            onClick={() => {
              if (selectedWard === topProblemWard[0]) {
                setSelectedWard('ALL');
              } else {
                setSelectedWard(topProblemWard[0]);
              }
            }}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative ${
              selectedWard !== 'ALL'
                ? 'bg-blue-50/80 border-[#256BF5] ring-4 ring-blue-300/40 shadow-md'
                : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                2. Where are Problems?
              </span>
              <MapPin className="w-4 h-4 text-[#256BF5]" />
            </div>
            <div className="mt-3">
              <div className="text-lg font-black text-slate-900 truncate">
                {topProblemWard[0]}
              </div>
              <p className="text-xs text-slate-600 font-bold mt-1 leading-snug">
                {topProblemWard[1]} active tickets in ward • {hotspots.length} recurrent flood hotspots detected.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-black text-[#256BF5] flex items-center gap-1">
              <span>{selectedWard !== 'ALL' ? `Filtering Ward ${selectedWard}` : 'Filter top problem ward'}</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* Question 3: Which tickets are approaching SLA? */}
          <div
            onClick={() => setKpiFilter(kpiFilter === 'APPROACHING_SLA' ? 'ALL' : 'APPROACHING_SLA')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative ${
              kpiFilter === 'APPROACHING_SLA'
                ? 'bg-orange-50/80 border-orange-500 ring-4 ring-orange-300/40 shadow-md'
                : 'bg-white border-slate-200 hover:border-orange-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded-full">
                3. Approaching SLA
              </span>
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                {approachingSlaReports.length}
              </div>
              <p className="text-xs text-slate-600 font-bold mt-1 leading-snug">
                {approachingSlaReports.length > 0
                  ? `${approachingSlaReports.length} tickets with < 2 hours remaining. Risk of breach.`
                  : 'Zero open tickets in danger zone (<2h SLA remaining).'}
              </p>
            </div>
            <div className="mt-3 text-[10px] font-black text-[#256BF5] flex items-center gap-1">
              <span>{kpiFilter === 'APPROACHING_SLA' ? 'Filtering active' : 'Click to inspect urgent SLA'}</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* Question 4: Which problems require escalation? */}
          <div
            onClick={() => setKpiFilter(kpiFilter === 'BREACHED' ? 'ALL' : 'BREACHED')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative ${
              kpiFilter === 'BREACHED'
                ? 'bg-red-50/80 border-[#EF4444] ring-4 ring-red-300/40 shadow-md'
                : 'bg-white border-slate-200 hover:border-red-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-800 bg-red-100 px-2.5 py-0.5 rounded-full">
                4. Require Escalation
              </span>
              <AlertOctagon className="w-4 h-4 text-[#EF4444]" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black font-mono text-[#EF4444]">
                {breachedReports.length}
              </div>
              <p className="text-xs text-slate-600 font-bold mt-1 leading-snug">
                {breachedReports.length > 0
                  ? `${slaBreachesCount} SLA breaches + ${reports.filter(r => r.status === 'ESCALATED').length} formally escalated to AEE.`
                  : 'No breached or escalated tickets pending review.'}
              </p>
            </div>
            <div className="mt-3 text-[10px] font-black text-[#EF4444] flex items-center gap-1">
              <span>{kpiFilter === 'BREACHED' ? 'Filtering active' : 'Click to inspect breaches'}</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SIX CORE MUNICIPAL KPI CARDS                                          */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
            Municipal Operational KPIs (Click any card to filter queue)
          </h3>
          {kpiFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setKpiFilter('ALL')}
              className="text-xs font-black text-[#256BF5] hover:underline flex items-center gap-1"
            >
              <span>Reset filter ({kpiFilter})</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* KPI 1: Total Reports */}
          <button
            type="button"
            onClick={() => setKpiFilter(kpiFilter === 'ALL' ? 'ALL' : 'ALL')}
            className={`p-4 rounded-2xl text-left border-2 transition-all ${
              kpiFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className={`text-[10px] font-black uppercase tracking-wider block ${kpiFilter === 'ALL' ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Reports
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono mt-1 block">
              {totalReportsCount}
            </span>
            <span className={`text-[10px] font-bold block mt-1 ${kpiFilter === 'ALL' ? 'text-slate-300' : 'text-slate-500'}`}>
              All logged incidents
            </span>
          </button>

          {/* KPI 2: Open Reports */}
          <button
            type="button"
            onClick={() => setKpiFilter(kpiFilter === 'OPEN' ? 'ALL' : 'OPEN')}
            className={`p-4 rounded-2xl text-left border-2 transition-all ${
              kpiFilter === 'OPEN'
                ? 'bg-[#FFC800] text-slate-950 border-amber-500 shadow-sm ring-2 ring-amber-300'
                : 'bg-white text-slate-900 border-slate-200 hover:border-amber-300'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
              Open Reports
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono mt-1 block text-slate-950">
              {openReportsCount}
            </span>
            <span className="text-[10px] font-bold text-amber-900/80 block mt-1">
              Awaiting squad dispatch
            </span>
          </button>

          {/* KPI 3: High/Critical Priority */}
          <button
            type="button"
            onClick={() => setKpiFilter(kpiFilter === 'HIGH_CRITICAL' ? 'ALL' : 'HIGH_CRITICAL')}
            className={`p-4 rounded-2xl text-left border-2 transition-all ${
              kpiFilter === 'HIGH_CRITICAL'
                ? 'bg-[#256BF5] text-white border-blue-700 shadow-sm ring-2 ring-blue-300'
                : 'bg-white text-slate-900 border-slate-200 hover:border-blue-300'
            }`}
          >
            <span className={`text-[10px] font-black uppercase tracking-wider block ${kpiFilter === 'HIGH_CRITICAL' ? 'text-blue-100' : 'text-blue-600'}`}>
              High / Critical
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono mt-1 block">
              {highCriticalCount}
            </span>
            <span className={`text-[10px] font-bold block mt-1 ${kpiFilter === 'HIGH_CRITICAL' ? 'text-blue-200' : 'text-slate-500'}`}>
              Score ≥ 70 or Critical
            </span>
          </button>

          {/* KPI 4: In Progress */}
          <button
            type="button"
            onClick={() => setKpiFilter(kpiFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
            className={`p-4 rounded-2xl text-left border-2 transition-all ${
              kpiFilter === 'IN_PROGRESS'
                ? 'bg-blue-600 text-white border-blue-800 shadow-sm ring-2 ring-blue-300'
                : 'bg-white text-slate-900 border-slate-200 hover:border-blue-300'
            }`}
          >
            <span className={`text-[10px] font-black uppercase tracking-wider block ${kpiFilter === 'IN_PROGRESS' ? 'text-blue-100' : 'text-blue-700'}`}>
              In Progress
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono mt-1 block">
              {inProgressCount}
            </span>
            <span className={`text-[10px] font-bold block mt-1 ${kpiFilter === 'IN_PROGRESS' ? 'text-blue-200' : 'text-slate-500'}`}>
              Crews on-site working
            </span>
          </button>

          {/* KPI 5: Resolved */}
          <button
            type="button"
            onClick={() => setKpiFilter(kpiFilter === 'RESOLVED' ? 'ALL' : 'RESOLVED')}
            className={`p-4 rounded-2xl text-left border-2 transition-all ${
              kpiFilter === 'RESOLVED'
                ? 'bg-[#10B981] text-white border-emerald-700 shadow-sm ring-2 ring-emerald-300'
                : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-300'
            }`}
          >
            <span className={`text-[10px] font-black uppercase tracking-wider block ${kpiFilter === 'RESOLVED' ? 'text-emerald-100' : 'text-emerald-600'}`}>
              Resolved
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono mt-1 block">
              {resolvedCount}
            </span>
            <span className={`text-[10px] font-bold block mt-1 ${kpiFilter === 'RESOLVED' ? 'text-emerald-200' : 'text-slate-500'}`}>
              Evidence verified
            </span>
          </button>

          {/* KPI 6: SLA Breaches */}
          <button
            type="button"
            onClick={() => setKpiFilter(kpiFilter === 'BREACHED' ? 'ALL' : 'BREACHED')}
            className={`p-4 rounded-2xl text-left border-2 transition-all ${
              kpiFilter === 'BREACHED'
                ? 'bg-[#EF4444] text-white border-red-700 shadow-sm ring-2 ring-red-300'
                : 'bg-white text-slate-900 border-slate-200 hover:border-red-300'
            }`}
          >
            <span className={`text-[10px] font-black uppercase tracking-wider block ${kpiFilter === 'BREACHED' ? 'text-red-100' : 'text-red-600'}`}>
              SLA Breaches
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono mt-1 block">
              {slaBreachesCount}
            </span>
            <span className={`text-[10px] font-bold block mt-1 ${kpiFilter === 'BREACHED' ? 'text-red-200' : 'text-slate-500'}`}>
              Time limit exceeded
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DRAINAGE HOTSPOT CLUSTERS (OPERATIONAL SIGNALS)                        */}
      {/* ========================================================================= */}
      <div className="bg-[#EDF4FF] rounded-3xl p-6 border-2 border-blue-200 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#EF4444] animate-pulse" />
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Drainage Hotspots (Operational Triage Signals)
              </h3>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Repeated reports in a concentrated area may indicate a persistent drainage issue. Prototype rule: ≥3 reports within 200m.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-blue-800 bg-white border border-blue-200 px-3 py-1 rounded-full shadow-xs">
              {hotspots.length} Monitored Hotspots
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hotspots.map(hs => (
            <div
              key={hs.id}
              onClick={() => setSelectedWard(hs.ward.split('-')[1]?.trim() || hs.ward)}
              className="p-4 rounded-2xl bg-white border-2 border-blue-100 hover:border-[#256BF5] space-y-3 text-xs shadow-xs cursor-pointer transition-all hover:shadow-md"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="font-mono text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded block mb-1">
                    {hs.id}
                  </span>
                  <h4 className="font-black text-slate-900 text-sm leading-tight">{hs.location_name}</h4>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex-shrink-0 ${
                    hs.operational_status === 'RESOLVED_MONITORED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : hs.operational_status === 'UNDER_INTERVENTION'
                      ? 'bg-blue-100 text-[#256BF5]'
                      : 'bg-red-100 text-[#EF4444]'
                  }`}
                >
                  {hs.operational_status ? hs.operational_status.replace(/_/g, ' ') : hs.risk_level}
                </span>
              </div>

              {/* Cluster Density Metrics */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px] font-bold">
                <div className="flex justify-between text-red-700 font-black">
                  <span>Density:</span>
                  <span>{hs.report_count} reports within 200m</span>
                </div>
                <div className="flex justify-between text-amber-800">
                  <span>Unresolved:</span>
                  <span>{hs.unresolved_count ?? hs.report_count} active tickets</span>
                </div>
                {hs.high_priority_count !== undefined && (
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>High Priority:</span>
                    <span>{hs.high_priority_count} tickets</span>
                  </div>
                )}
              </div>

              {/* Severity Distribution Pills */}
              {hs.severity_distribution && (
                <div className="flex items-center gap-1 text-[9px] font-black font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800">
                    Crit: {hs.severity_distribution.critical}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    High: {hs.severity_distribution.high}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    Med: {hs.severity_distribution.medium}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Low: {hs.severity_distribution.low}
                  </span>
                </div>
              )}

              {/* Operational Action */}
              <div className="pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Suggested Action:
                </span>
                <p className="font-black text-[#256BF5] mt-0.5">
                  {hs.suggested_action || 'Inspect drainage segment / dispatch response crew'}
                </p>
              </div>

              <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-100">
                <span className="font-bold text-slate-600">Ward: {hs.ward}</span>
                <span>{hs.latest_report || hs.last_reported}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MUNICIPAL INCIDENT TABLE WITH VISUAL STATUS BADGES                     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        {/* Table Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#256BF5]" /> Municipal Incident Operations Queue
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Click any row to inspect full ticket diagnostic side panel, review AI confidence, and dispatch crews.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search ticket, ward, landmark..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-[#256BF5]"
              />
            </div>

            {/* Ward Filter */}
            <select
              value={selectedWard}
              onChange={e => setSelectedWard(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-900 focus:outline-hidden focus:border-[#256BF5]"
            >
              <option value="ALL">All Keralam Wards</option>
              <option value="Vyttila">Ward 24 (Vyttila)</option>
              <option value="Kadavanthra">Ward 35 (Kadavanthra)</option>
              <option value="Fort Kochi">Ward 12 (Fort Kochi)</option>
              <option value="Edappally">Ward 40 (Edappally)</option>
              <option value="Kaloor">Ward 28 (Kaloor)</option>
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-900 focus:outline-hidden focus:border-[#256BF5]"
            >
              <option value="priority">Sort: NIRA Priority</option>
              <option value="sla">Sort: SLA Urgency</option>
              <option value="newest">Sort: Newest First</option>
            </select>
          </div>
        </div>

        {/* The Incident Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-3 py-3">Ticket ID</th>
                <th className="px-3 py-3">Issue</th>
                <th className="px-3 py-3">Ward</th>
                <th className="px-3 py-3">Severity</th>
                <th className="px-3 py-3">Priority Score</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Age</th>
                <th className="px-3 py-3">SLA</th>
                <th className="px-3 py-3">Assigned Crew / Officer</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500 font-medium">
                    No tickets found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map(rep => {
                  const sla = getSlaInfo(rep);
                  const isSelected = selectedTicket?.id === rep.id;

                  return (
                    <tr
                      key={rep.id}
                      onClick={() => setSelectedTicket(rep)}
                      className={`hover:bg-blue-50/60 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/80 ring-1 ring-[#256BF5]' : ''
                      }`}
                    >
                      {/* Ticket ID */}
                      <td className="px-3 py-3 font-mono font-black text-[#256BF5]">
                        <span className="bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                          {rep.ticket_code}
                        </span>
                      </td>

                      {/* Issue */}
                      <td className="px-3 py-3 font-bold text-slate-900">
                        <div className="max-w-[160px] truncate">
                          {rep.issue_type.replace(/_/g, ' ')}
                        </div>
                      </td>

                      {/* Ward */}
                      <td className="px-3 py-3">
                        <div className="font-black text-slate-900">{rep.ward}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                          {rep.landmark}
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="px-3 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            rep.severity === 'CRITICAL'
                              ? 'bg-red-100 text-[#EF4444]'
                              : rep.severity === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : rep.severity === 'MEDIUM'
                              ? 'bg-blue-100 text-[#256BF5]'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {rep.severity}
                        </span>
                      </td>

                      {/* Priority Score */}
                      <td className="px-3 py-3">
                        <NIRAPriorityBadge score={rep.priority_score} size="sm" />
                      </td>

                      {/* Visual Status Badges */}
                      <td className="px-3 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                            rep.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-[#10B981]'
                              : rep.status === 'ESCALATED'
                              ? 'bg-red-100 text-[#EF4444]'
                              : rep.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-[#256BF5]'
                              : rep.status === 'ASSIGNED'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rep.status === 'IN_PROGRESS' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#256BF5] animate-pulse"></span>
                          )}
                          <span>{rep.status === 'OPEN' ? 'REPORTED' : rep.status.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Age */}
                      <td className="px-3 py-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {formatAge(rep.created_at)}
                      </td>

                      {/* SLA */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            rep.status === 'RESOLVED'
                              ? 'bg-slate-100 text-slate-600'
                              : sla.isBreached
                              ? 'bg-red-100 text-[#EF4444]'
                              : sla.isApproaching
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-50 text-[#256BF5]'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>
                            {rep.status === 'RESOLVED'
                              ? `Met (${sla.elapsedHours}h)`
                              : sla.remainingDisplay}
                          </span>
                        </span>
                      </td>

                      {/* Assigned Crew/Officer */}
                      <td className="px-3 py-3 text-slate-700 font-bold">
                        <div className="truncate max-w-[150px]">
                          {rep.assigned_crew || rep.assigned_officer ? (
                            <span className="text-slate-800">
                              {rep.assigned_crew || rep.assigned_officer}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal italic">Unassigned</span>
                          )}
                        </div>
                      </td>

                      {/* Inspect / Quick Action */}
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {rep.status !== 'RESOLVED' && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setResolutionModalReport(rep);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-[#10B981] hover:text-white text-emerald-700 font-black text-[10px] transition-all flex items-center gap-1 border border-emerald-200"
                            >
                              <FileCheck className="w-3 h-3" />
                              <span>Resolve</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedTicket(rep);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-[#256BF5] hover:text-white text-slate-700 font-black text-[10px] transition-all flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. SLIDE-OVER DETAILED SIDE PANEL                                        */}
      {/* ========================================================================= */}
      {selectedTicket && (
        <IncidentSidePanel
          report={selectedTicket}
          hotspots={hotspots}
          allReports={reports}
          availableCrews={AVAILABLE_CREWS}
          simulatedNowMs={simulatedNowMs}
          onClose={() => setSelectedTicket(null)}
          onReportUpdated={updated => {
            onReportUpdated(updated);
            setSelectedTicket(updated);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* QUICK MODAL 1: CREW ASSIGNMENT MODAL (Fallback/Direct access)             */}
      {/* ========================================================================= */}
      {crewModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-blue-100 shadow-2xl space-y-5">
            <button
              type="button"
              onClick={() => setCrewModalReport(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#256BF5] text-white flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Dispatch Rapid Action Crew</h3>
                <p className="text-xs text-slate-500 font-bold">
                  {crewModalReport.ticket_code} • {crewModalReport.ward} (Ward #{crewModalReport.ward_number})
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-700">
                Select Available Municipal Crew
              </label>
              <div className="space-y-2">
                {AVAILABLE_CREWS.map((crew, i) => (
                  <label
                    key={i}
                    onClick={() => setSelectedCrew(crew)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-bold cursor-pointer transition-all ${
                      selectedCrew === crew
                        ? 'bg-blue-50 border-[#256BF5] text-[#256BF5]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{crew}</span>
                    <input
                      type="radio"
                      name="crewSelect"
                      checked={selectedCrew === crew}
                      onChange={() => setSelectedCrew(crew)}
                      className="text-[#256BF5]"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCrewModalReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingId === crewModalReport.id}
                onClick={handleConfirmAssignCrew}
                className="px-5 py-2.5 rounded-xl bg-[#256BF5] hover:bg-blue-600 text-white text-xs font-black shadow-md shadow-blue-500/25"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK MODAL 2: CLOSED-LOOP RESOLUTION EVIDENCE MODAL                      */}
      {/* ========================================================================= */}
      {resolutionModalReport && (
        <ResolutionEvidenceModal
          report={resolutionModalReport}
          onClose={() => setResolutionModalReport(null)}
          onResolved={updatedObj => {
            onReportUpdated(updatedObj);
            if (selectedTicket?.id === updatedObj.id) {
              setSelectedTicket(updatedObj);
            }
            setResolutionModalReport(null);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* QUICK MODAL 3: ESCALATION MODAL                                           */}
      {/* ========================================================================= */}
      {escalationModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-red-100 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setEscalationModalReport(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EF4444] text-white flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Escalate Stalled Ticket</h3>
                <p className="text-xs text-slate-500 font-mono font-bold">
                  {escalationModalReport.ticket_code}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                Escalation Justification
              </label>
              <textarea
                rows={3}
                value={escalationReason}
                onChange={e => setEscalationReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:outline-hidden focus:border-[#EF4444]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEscalationModalReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingId === escalationModalReport.id}
                onClick={handleConfirmEscalate}
                className="px-5 py-2.5 rounded-xl bg-[#EF4444] hover:bg-red-600 text-white text-xs font-black shadow-md shadow-red-500/25"
              >
                Notify Assistant Executive Engineer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
