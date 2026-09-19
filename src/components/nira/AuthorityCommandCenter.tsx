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
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
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
  const [activeTab, setActiveTab] = useState<'queue' | 'hotspots'>('queue');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);

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
    <div className="space-y-6 animate-fadeIn">
      {/* 1. CLEAN HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/nira-logo.png" alt="NIRA Logo" className="w-full h-full object-contain mix-blend-multiply" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Municipal Command Center
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Monitor incoming reports, assign field crews, and track issue resolutions
            </p>
          </div>
        </div>

        {/* Right Header Actions: Authority Badge + Subtle Demo Simulator Toggle */}
        <div className="flex items-center flex-wrap gap-2.5">
          {isAuthority ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800">
              <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Officer: {user?.email?.split('@')[0]}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => (onOpenAuthModal ? onOpenAuthModal() : null)}
              className="px-3.5 py-1.5 rounded-xl bg-[#FFC800] hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Officer Sign In</span>
            </button>
          )}

          {/* Collapsible Demo Controls Toggle */}
          {isAuthority && (
            <button
              type="button"
              onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isSimulatorOpen || demoClockOffsetHours > 0
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-black'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Timer className="w-3.5 h-3.5 text-amber-600" />
              <span>Demo Clock {demoClockOffsetHours > 0 ? `(+${demoClockOffsetHours}h)` : ''}</span>
              {isSimulatorOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* 1B. COLLAPSIBLE DEMO CONTROLS (EXPANDS ONLY WHEN REQUESTED) */}
      {isAuthority && isSimulatorOpen && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 shadow-xs flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                Simulation Sandbox
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-800 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                Offset: +{demoClockOffsetHours}h ({new Date(simulatedNowMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            </div>
            <p className="text-[11px] text-amber-800/80 font-medium">
              Simulate elapsed time to test automated SLA alerts and supervisory escalation.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDemoClockOffsetHours(prev => prev + 1)}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-slate-900 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <FastForward className="w-3 h-3 text-amber-600" />
              <span>+1h</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoClockOffsetHours(prev => prev + 4)}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-slate-900 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <FastForward className="w-3 h-3 text-amber-600" />
              <span>+4h</span>
            </button>
            <button
              type="button"
              onClick={handleTriggerSlaBreach}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Zap className="w-3 h-3 text-[#FFC800]" />
              <span>Trigger SLA Breach</span>
            </button>
            {demoClockOffsetHours > 0 && (
              <button
                type="button"
                onClick={() => setDemoClockOffsetHours(0)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. FOUR ESSENTIAL KPI STATS (ACT AS 1-CLICK QUICK FILTERS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: All Reports */}
        <button
          type="button"
          onClick={() => {
            setKpiFilter('ALL');
            setActiveTab('queue');
          }}
          className={`p-4 sm:p-5 rounded-2xl text-left border-2 transition-all cursor-pointer ${
            kpiFilter === 'ALL' && activeTab === 'queue'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${
              kpiFilter === 'ALL' && activeTab === 'queue' ? 'text-slate-300' : 'text-slate-500'
            }`}>
              Total Reports
            </span>
            <Activity className={`w-4 h-4 ${kpiFilter === 'ALL' && activeTab === 'queue' ? 'text-slate-300' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono mt-1.5">
            {totalReportsCount}
          </div>
          <span className={`text-[10px] sm:text-[11px] font-medium block mt-1 ${
            kpiFilter === 'ALL' && activeTab === 'queue' ? 'text-slate-300' : 'text-slate-400'
          }`}>
            All logged incidents
          </span>
        </button>

        {/* Card 2: Needs Action */}
        <button
          type="button"
          onClick={() => {
            setKpiFilter(kpiFilter === 'ATTENTION_NOW' ? 'ALL' : 'ATTENTION_NOW');
            setActiveTab('queue');
          }}
          className={`p-4 sm:p-5 rounded-2xl text-left border-2 transition-all cursor-pointer ${
            kpiFilter === 'ATTENTION_NOW' && activeTab === 'queue'
              ? 'bg-[#FFC800] text-slate-950 border-amber-500 shadow-md ring-2 ring-amber-300'
              : 'bg-white text-slate-900 border-slate-200 hover:border-amber-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-800">
              Needs Action
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono mt-1.5 text-slate-950">
            {attentionNowReports.length}
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium text-amber-900/80 block mt-1">
            Unassigned or high risk
          </span>
        </button>

        {/* Card 3: In Progress */}
        <button
          type="button"
          onClick={() => {
            setKpiFilter(kpiFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS');
            setActiveTab('queue');
          }}
          className={`p-4 sm:p-5 rounded-2xl text-left border-2 transition-all cursor-pointer ${
            kpiFilter === 'IN_PROGRESS' && activeTab === 'queue'
              ? 'bg-[#256BF5] text-white border-blue-700 shadow-md ring-2 ring-blue-300'
              : 'bg-white text-slate-900 border-slate-200 hover:border-blue-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${
              kpiFilter === 'IN_PROGRESS' && activeTab === 'queue' ? 'text-blue-100' : 'text-blue-700'
            }`}>
              In Progress
            </span>
            <Users className={`w-4 h-4 ${kpiFilter === 'IN_PROGRESS' && activeTab === 'queue' ? 'text-blue-200' : 'text-[#256BF5]'}`} />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono mt-1.5">
            {inProgressCount}
          </div>
          <span className={`text-[10px] sm:text-[11px] font-medium block mt-1 ${
            kpiFilter === 'IN_PROGRESS' && activeTab === 'queue' ? 'text-blue-200' : 'text-slate-400'
          }`}>
            Crews dispatched
          </span>
        </button>

        {/* Card 4: Resolved */}
        <button
          type="button"
          onClick={() => {
            setKpiFilter(kpiFilter === 'RESOLVED' ? 'ALL' : 'RESOLVED');
            setActiveTab('queue');
          }}
          className={`p-4 sm:p-5 rounded-2xl text-left border-2 transition-all cursor-pointer ${
            kpiFilter === 'RESOLVED' && activeTab === 'queue'
              ? 'bg-[#10B981] text-white border-emerald-700 shadow-md ring-2 ring-emerald-300'
              : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${
              kpiFilter === 'RESOLVED' && activeTab === 'queue' ? 'text-emerald-100' : 'text-emerald-700'
            }`}>
              Resolved
            </span>
            <CheckCircle2 className={`w-4 h-4 ${kpiFilter === 'RESOLVED' && activeTab === 'queue' ? 'text-emerald-200' : 'text-[#10B981]'}`} />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono mt-1.5">
            {resolvedCount}
          </div>
          <span className={`text-[10px] sm:text-[11px] font-medium block mt-1 ${
            kpiFilter === 'RESOLVED' && activeTab === 'queue' ? 'text-emerald-200' : 'text-slate-400'
          }`}>
            Completed & cleared
          </span>
        </button>
      </div>

      {/* 2B. CLEAN SINGLE-ROW SLA OVERDUE NOTIFICATION (ONLY WHEN BREACHES OCCUR) */}
      {breachedReports.length > 0 && (
        <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 animate-pulse" />
            <div>
              <span className="text-xs sm:text-sm font-black text-red-950">
                {breachedReports.length} {breachedReports.length === 1 ? 'ticket has' : 'tickets have'} exceeded municipal SLA response limits
              </span>
              <span className="text-[11px] text-red-800 block font-medium">
                Requires supervisory intervention or priority crew assignment
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setKpiFilter(kpiFilter === 'BREACHED' ? 'ALL' : 'BREACHED');
              setActiveTab('queue');
            }}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>{kpiFilter === 'BREACHED' ? 'Show All Tickets' : 'Filter Overdue Tickets'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. VIEW TOGGLE BAR: INCIDENTS QUEUE vs HOTSPOT ZONES */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-[#256BF5]" />
            <span>Incidents Queue</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
              {filteredReports.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hotspots')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'hotspots'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span>Hotspot Areas</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
              {hotspots.length}
            </span>
          </button>
        </div>

        {/* Search & Ward Filter Controls (Visible in Queue view) */}
        {activeTab === 'queue' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search ticket, ward, issue..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#256BF5] w-40 sm:w-56 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <select
              value={selectedWard}
              onChange={e => setSelectedWard(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#256BF5] shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Wards</option>
              <option value="Vyttila">Vyttila (Ward 24)</option>
              <option value="Kadavanthra">Kadavanthra (Ward 35)</option>
              <option value="Fort Kochi">Fort Kochi (Ward 12)</option>
              <option value="Edappally">Edappally (Ward 40)</option>
              <option value="Kaloor">Kaloor (Ward 28)</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#256BF5] shadow-2xs cursor-pointer"
            >
              <option value="priority">Sort: Priority Score</option>
              <option value="sla">Sort: SLA Urgency</option>
              <option value="newest">Sort: Newest First</option>
            </select>
          </div>
        )}
      </div>

      {/* 4A. TAB 1: INCIDENTS QUEUE (SIMPLIFIED & SCANNABLE) */}
      {activeTab === 'queue' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Active filter badge if filtering */}
          {kpiFilter !== 'ALL' && (
            <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">Filtered by:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#256BF5] text-white font-black text-[10px] uppercase">
                  {kpiFilter.replace('_', ' ')}
                </span>
                <span className="text-slate-400 font-medium">({filteredReports.length} results)</span>
              </div>
              <button
                type="button"
                onClick={() => setKpiFilter('ALL')}
                className="text-[#256BF5] hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <span>Clear filter</span>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {filteredReports.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Filter className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-slate-800">No Incidents Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                No reports match the selected filters. Try changing your search query or reset your filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setKpiFilter('ALL');
                  setSelectedWard('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredReports.map(rep => {
                const sla = getSlaInfo(rep);
                const isSelected = selectedTicket?.id === rep.id;

                return (
                  <div
                    key={rep.id}
                    onClick={() => setSelectedTicket(rep)}
                    className={`p-4 sm:px-6 sm:py-4.5 hover:bg-blue-50/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected ? 'bg-blue-50/70' : ''
                    }`}
                  >
                    {/* Left: Ticket ID, Issue & Ward */}
                    <div className="space-y-1 sm:max-w-md">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-[#256BF5] text-xs bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg">
                          {rep.ticket_code}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {formatAge(rep.created_at)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
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
                      </div>

                      <h4 className="text-sm font-black text-slate-900 leading-snug">
                        {rep.issue_type.replace(/_/g, ' ')}
                      </h4>

                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span className="text-slate-800 font-bold">{rep.ward}</span>
                        {rep.landmark && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px]">{rep.landmark}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Middle: Priority Score & SLA Window */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      <NIRAPriorityBadge score={rep.priority_score} size="sm" />

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black ${
                          rep.status === 'RESOLVED'
                            ? 'bg-slate-100 text-slate-600'
                            : sla.isBreached
                            ? 'bg-red-100 text-[#EF4444]'
                            : sla.isApproaching
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-50 text-[#256BF5]'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {rep.status === 'RESOLVED' ? `Resolved in ${sla.elapsedHours}h` : sla.remainingDisplay}
                        </span>
                      </span>
                    </div>

                    {/* Right: Crew Assigned & Action Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Crew Info */}
                      <div className="text-left sm:text-right text-xs pr-2 hidden md:block">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned Squad</span>
                        <span className="font-bold text-slate-800 truncate max-w-[150px] block">
                          {rep.assigned_crew ? rep.assigned_crew.split('(')[0] : 'Unassigned'}
                        </span>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                        {rep.status !== 'RESOLVED' ? (
                          <>
                            {!rep.assigned_crew && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setCrewModalReport(rep);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-[#256BF5] hover:text-white text-[#256BF5] font-black text-xs transition-all flex items-center gap-1 border border-blue-200 cursor-pointer"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Assign</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setResolutionModalReport(rep);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#10B981] hover:text-white text-emerald-700 font-black text-xs transition-all flex items-center gap-1 border border-emerald-200 cursor-pointer"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Resolve</span>
                            </button>
                          </>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center gap-1 border border-emerald-200">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedTicket(rep);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4B. TAB 2: HOTSPOT CLUSTER ANALYSIS (CLEAN & ACCESSIBLE) */}
      {activeTab === 'hotspots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Geographic clusters where multiple drainage reports were received within 200 meters.
            </p>
            <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              {hotspots.length} Active Hotspots
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hotspots.map(hs => (
              <div
                key={hs.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-[#256BF5] transition-all"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 block mb-1">
                      {hs.id} • {hs.ward}
                    </span>
                    <h4 className="font-black text-slate-900 text-base leading-tight">
                      {hs.location_name}
                    </h4>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      hs.risk_level === 'CRITICAL'
                        ? 'bg-red-100 text-[#EF4444]'
                        : hs.risk_level === 'HIGH'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-[#256BF5]'
                    }`}
                  >
                    {hs.risk_level} Risk
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Concentration:</span>
                    <span className="text-red-600 font-black">{hs.report_count} reports in 200m</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-600">
                    <span>Unresolved:</span>
                    <span>{hs.unresolved_count ?? hs.report_count} tickets</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 font-medium">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-0.5">
                    Recommended Action
                  </span>
                  <p className="font-bold text-[#256BF5]">
                    {hs.suggested_action || 'Dispatch vacuum desilting squad'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const wardName = hs.ward.includes('-') ? hs.ward.split('-')[1]?.trim() : hs.ward;
                    setSelectedWard(wardName || 'ALL');
                    setActiveTab('queue');
                  }}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-[#256BF5] hover:text-white text-slate-800 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Filter Incidents in this Ward</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
