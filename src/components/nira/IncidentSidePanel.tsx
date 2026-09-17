'use client';

import React, { useState, useRef } from 'react';
import { DrainageReport, HotspotCluster, SeverityLevel, ReportStatus } from '@/lib/niraTypes';
import { niraService, calculatePriorityScore } from '@/lib/niraService';
import { NIRAPriorityBadge } from './NIRAPriorityBadge';
import { NIRAPriorityCard } from './NIRAPriorityCard';
import { ResolutionEvidenceModal } from './ResolutionEvidenceModal';
import {
  X,
  MapPin,
  Clock,
  Building2,
  Users,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  UploadCloud,
  FileText,
  Flame,
  Send,
  Eye,
  Sliders,
  Sparkles,
  ArrowRight,
  AlertOctagon,
  ChevronRight,
  Check,
  ShieldCheck,
  FileCheck,
  Timer,
  Zap,
  History,
} from 'lucide-react';
import {
  evaluateSla,
  getAuthorityLevelInfo,
  escalateReportOnBreach,
  SLA_RULES,
  formatDurationHoursMinutes,
} from '@/lib/slaEngine';

export interface IncidentSidePanelProps {
  report: DrainageReport | null;
  hotspots: HotspotCluster[];
  allReports: DrainageReport[];
  availableCrews: string[];
  simulatedNowMs?: number;
  onClose: () => void;
  onReportUpdated: (updatedReport: DrainageReport) => void;
}

export const IncidentSidePanel: React.FC<IncidentSidePanelProps> = ({
  report,
  hotspots,
  allReports,
  availableCrews,
  simulatedNowMs,
  onClose,
  onReportUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'notes'>('overview');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [showResolutionModal, setShowResolutionModal] = useState<boolean>(false);

  // Form states for quick actions
  const [selectedCrew, setSelectedCrew] = useState<string>(
    report?.assigned_crew || availableCrews[0]
  );
  const [overrideSeverity, setOverrideSeverity] = useState<SeverityLevel>(
    report?.severity || 'HIGH'
  );
  const [newInternalNote, setNewInternalNote] = useState<string>('');
  const [escalationReason, setEscalationReason] = useState<string>(
    report?.escalated_reason ||
      'SLA Breached: Stalled over allowable time during active monsoon downpour. Requires Assistant Executive Engineer intervention.'
  );

  // Resolution evidence
  const [resolutionPhotoUrl, setResolutionPhotoUrl] = useState<string>(
    report?.resolution_photo_url ||
      'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80'
  );
  const [resolutionNotes, setResolutionNotes] = useState<string>(
    report?.resolution_notes ||
      'Drain cleared using high-pressure jetting and suction pump. Water flow fully restored.'
  );
  const [isUploadingResolution, setIsUploadingResolution] = useState<boolean>(false);
  const resolutionFileInputRef = useRef<HTMLInputElement>(null);

  if (!report) return null;

  // SLA Calculation using centralized SLA engine
  const simulatedTime = simulatedNowMs || Date.now();
  const sla = evaluateSla(report, simulatedTime);
  const elapsedHours = sla.elapsedHours;
  const slaLimit = sla.slaLimitHours;
  const remainingHours = sla.remainingHours;
  const isBreached = sla.isBreached;
  const isApproaching = sla.isApproaching;
  const currentAuth = sla.currentAuthorityLevel;
  const nextAuth =
    sla.nextAuthorityLevel ??
    getAuthorityLevelInfo((sla.currentAuthorityLevel.level || 1) + 1, report.ward_number);

  // Check if inside a known hotspot
  const matchingHotspot = hotspots.find(
    hs =>
      hs.ward.toLowerCase() === report.ward.toLowerCase() ||
      Math.sqrt(
        Math.pow(hs.center_lat - report.lat, 2) + Math.pow(hs.center_lng - report.lng, 2)
      ) < 0.015
  );

  // Nearby unresolved report count in this ward
  const nearbyReportsCount = allReports.filter(
    r => r.ward.toLowerCase() === report.ward.toLowerCase() && r.id !== report.id
  ).length;

  // Re-evaluate full priority breakdown using deterministic engine
  const priorityData = calculatePriorityScore(report.issue_type, report.severity, true, {
    ward: report.ward,
    lat: report.lat,
    lng: report.lng,
    nearbyUnresolvedCount: nearbyReportsCount,
  });

  // Action Handlers
  const handleAssignCrew = async () => {
    setIsUpdating(true);
    try {
      const nowIso = new Date(simulatedTime).toISOString();
      await niraService.updateReportStatus(report.id, 'ASSIGNED', {
        assignedCrew: selectedCrew,
        assignedOfficer: selectedCrew,
        assignedAt: report.assigned_at || nowIso,
        slaState: 'ASSIGNED',
      });
      const updated: DrainageReport = {
        ...report,
        status: 'ASSIGNED',
        assigned_crew: selectedCrew,
        assigned_officer: selectedCrew,
        assigned_at: report.assigned_at || nowIso,
        sla_state: 'ASSIGNED',
        updated_at: nowIso,
      };
      onReportUpdated(updated);
    } catch (e) {
      console.error('Failed to assign crew:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartWork = async () => {
    setIsUpdating(true);
    try {
      const nowIso = new Date(simulatedTime).toISOString();
      await niraService.updateReportStatus(report.id, 'IN_PROGRESS', {
        assignedCrew: report.assigned_crew || selectedCrew,
        slaState: 'IN_PROGRESS',
      });
      const updated: DrainageReport = {
        ...report,
        status: 'IN_PROGRESS',
        assigned_crew: report.assigned_crew || selectedCrew,
        sla_state: 'IN_PROGRESS',
        updated_at: nowIso,
      };
      onReportUpdated(updated);
    } catch (e) {
      console.error('Failed to start work:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePriority = async () => {
    setIsUpdating(true);
    try {
      const recalculated = calculatePriorityScore(report.issue_type, overrideSeverity, true, {
        ward: report.ward,
        lat: report.lat,
        lng: report.lng,
      });

      await niraService.updateReportStatus(report.id, report.status, {
        severity: overrideSeverity,
        priorityScore: recalculated.score,
      });

      const updated: DrainageReport = {
        ...report,
        severity: overrideSeverity,
        priority_score: recalculated.score,
        priority_explanation: recalculated.explanation,
        sla_hours: recalculated.slaHours,
        updated_at: new Date().toISOString(),
      };
      onReportUpdated(updated);
    } catch (e) {
      console.error('Failed to change priority:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInternalNote.trim()) return;

    setIsUpdating(true);
    try {
      const timestampedNote = `[${new Date(simulatedTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}] ${newInternalNote.trim()}`;
      const existingNotes = report.internal_notes || [];
      const updatedNotes = [...existingNotes, timestampedNote];

      await niraService.updateReportStatus(report.id, report.status, {
        internalNotes: updatedNotes,
      });

      const updated: DrainageReport = {
        ...report,
        internal_notes: updatedNotes,
        updated_at: new Date(simulatedTime).toISOString(),
      };
      onReportUpdated(updated);
      setNewInternalNote('');
    } catch (e) {
      console.error('Failed to add internal note:', e);
    } finally {
      setIsUpdating(false);
    }
  };

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

  const handleConfirmResolve = async () => {
    setIsUpdating(true);
    const now = new Date(simulatedTime).toISOString();
    try {
      await niraService.updateReportStatus(report.id, 'RESOLVED', {
        resolutionPhotoUrl,
        resolutionNotes,
        slaState: 'RESOLVED',
      });

      const updated: DrainageReport = {
        ...report,
        status: 'RESOLVED',
        sla_state: 'RESOLVED',
        resolution_photo_url: resolutionPhotoUrl,
        resolution_notes: resolutionNotes,
        resolved_at: now,
        updated_at: now,
      };

      onReportUpdated(updated);
    } catch (e) {
      console.error('Failed to resolve report:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmEscalate = async () => {
    setIsUpdating(true);
    try {
      const nowIso = new Date(simulatedTime).toISOString();
      const escalated = escalateReportOnBreach(report, {
        customReason: escalationReason,
        simulatedCurrentTimeMs: simulatedTime,
      });

      await niraService.updateReportStatus(report.id, 'ESCALATED', {
        escalatedReason: escalationReason,
        escalationLevel: escalated.escalation_level,
        escalatedAt: escalated.escalated_at,
        slaState: 'ESCALATED',
        escalationHistory: escalated.escalation_history,
      });

      onReportUpdated(escalated);
    } catch (e) {
      console.error('Failed to escalate report:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  // 7 Required States according to municipal SLA & escalation specifications:
  // Reported, Assigned, In Progress, SLA Approaching, SLA Breached, Escalated, Resolved
  const requiredSlaLifecycle = [
    {
      state: 'REPORTED',
      label: 'Reported',
      isCompleted: true,
      isCurrent: sla.slaState === 'REPORTED',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      state: 'ASSIGNED',
      label: 'Assigned',
      isCompleted: Boolean(report.assigned_crew) || report.status === 'ASSIGNED' || report.status === 'IN_PROGRESS' || report.status === 'RESOLVED',
      isCurrent: sla.slaState === 'ASSIGNED',
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      state: 'IN_PROGRESS',
      label: 'In Progress',
      isCompleted: report.status === 'IN_PROGRESS' || report.status === 'RESOLVED',
      isCurrent: sla.slaState === 'IN_PROGRESS',
      badgeColor: 'bg-blue-100 text-[#256BF5]',
    },
    {
      state: 'SLA_APPROACHING',
      label: 'SLA Approaching',
      isCompleted: sla.isApproaching || sla.isBreached || report.status === 'ESCALATED',
      isCurrent: sla.slaState === 'SLA_APPROACHING',
      badgeColor: 'bg-amber-100 text-amber-800',
      isWarning: true,
    },
    {
      state: 'SLA_BREACHED',
      label: 'SLA Breached',
      isCompleted: sla.isBreached || report.status === 'ESCALATED' || report.sla_state === 'SLA_BREACHED',
      isCurrent: sla.slaState === 'SLA_BREACHED',
      badgeColor: 'bg-red-100 text-red-700',
      isDanger: true,
    },
    {
      state: 'ESCALATED',
      label: 'Escalated',
      isCompleted: report.status === 'ESCALATED' || (report.escalation_level !== undefined && report.escalation_level > 1),
      isCurrent: sla.slaState === 'ESCALATED',
      badgeColor: 'bg-red-200 text-red-900',
      isDanger: true,
    },
    {
      state: 'RESOLVED',
      label: 'Resolved',
      isCompleted: report.status === 'RESOLVED',
      isCurrent: sla.slaState === 'RESOLVED',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      isSuccess: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      {/* SIDE PANEL CONTAINER */}
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200">
        {/* 1. TOP HEADER */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
              <img src="/nira-logo.png" alt="NIRA Logo" className="w-full h-full object-contain mix-blend-multiply" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 font-mono">
                  {report.ticket_code}
                </h3>
                <NIRAPriorityBadge score={report.priority_score} size="sm" />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {report.ward} (Ward #{report.ward_number}) •{' '}
                {report.authority || 'Keralam Municipal Corporation'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Close side panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. SUB-NAV TABS */}
        <div className="px-5 border-b border-slate-200 bg-white flex items-center gap-6 text-xs font-black">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-[#256BF5] text-[#256BF5]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Incident Overview
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'actions'
                ? 'border-[#256BF5] text-[#256BF5]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Operations & Dispatch</span>
            {isBreached && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'notes'
                ? 'border-[#256BF5] text-[#256BF5]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Internal Notes ({report.internal_notes?.length || 0})
          </button>
        </div>

        {/* 3. SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: INCIDENT OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* STATUS WORKFLOW TIMELINE: 7 REQUIRED SLA STATES */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-[#256BF5]" />
                    Municipal SLA & Resolution Lifecycle (7 Stages)
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      sla.slaState === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sla.slaState === 'ESCALATED'
                        ? 'bg-red-200 text-red-900 border border-red-300'
                        : sla.slaState === 'SLA_BREACHED'
                        ? 'bg-red-100 text-[#EF4444] border border-red-200'
                        : sla.slaState === 'SLA_APPROACHING'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : sla.slaState === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-[#256BF5]'
                        : sla.slaState === 'ASSIGNED'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    Current: {sla.slaState.replace('_', ' ')}
                  </span>
                </div>

                {/* 7-State Step Indicators */}
                <div className="grid grid-cols-7 gap-1.5 pt-1 text-center">
                  {requiredSlaLifecycle.map((step, idx) => (
                    <div key={idx} className="space-y-1">
                      <div
                        className={`h-2 rounded-full transition-all relative ${
                          step.isCompleted
                            ? step.isDanger
                              ? 'bg-[#EF4444]'
                              : step.isWarning
                              ? 'bg-amber-500'
                              : step.isSuccess
                              ? 'bg-emerald-500'
                              : 'bg-[#256BF5]'
                            : 'bg-slate-200'
                        }`}
                      >
                        {step.isCurrent && (
                          <span className="absolute inset-0 rounded-full bg-current opacity-75 animate-ping"></span>
                        )}
                      </div>
                      <span
                        className={`text-[9px] leading-tight block truncate ${
                          step.isCurrent
                            ? 'text-slate-950 font-black'
                            : step.isCompleted
                            ? 'text-slate-700 font-bold'
                            : 'text-slate-400'
                        }`}
                        title={step.label}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PROMINENT SLA BREACHED WARNING BANNER */}
              {(sla.isBreached || report.status === 'ESCALATED' || report.sla_state === 'SLA_BREACHED') && (
                <div className="p-4 sm:p-5 rounded-3xl bg-red-50/95 border-2 border-red-500 text-slate-900 shadow-md space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
                      <span className="text-xs font-black uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                        <AlertOctagon className="w-4 h-4 text-red-600" />
                        SLA BREACHED
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 border border-red-200 text-red-800 text-[10px] font-black font-mono">
                      +{Math.max(0, sla.elapsedHours - sla.slaLimitHours).toFixed(1)}h OVERDUE
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/90 p-3 rounded-2xl border border-red-200 text-xs shadow-2xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Ticket</span>
                      <span className="font-black text-slate-900 font-mono">{report.ticket_code}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Ward</span>
                      <span className="font-black text-slate-900">{report.ward}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Elapsed</span>
                      <span className="font-black text-red-600 font-mono">{sla.elapsedFormatted}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">SLA Limit</span>
                      <span className="font-black text-slate-900 font-mono">{sla.slaLimitHours}h</span>
                    </div>
                  </div>

                  {/* Configured Authority Escalation Routing */}
                  <div className="p-3.5 bg-red-600 text-white rounded-2xl text-xs space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black tracking-wider text-red-100 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-[#FFC800]" />
                        Configured Authority Escalation Routing:
                      </span>
                      <span className="text-[10px] font-bold text-red-200">
                        Operational Prototype
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 font-black text-xs">
                      <span className="bg-red-700/90 px-2.5 py-1 rounded-xl text-white">
                        Level {currentAuth.level} → {currentAuth.title}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#FFC800] shrink-0" />
                      <span className="bg-white text-red-700 px-2.5 py-1 rounded-xl shadow-xs">
                        Level {nextAuth.level} → {nextAuth.title}
                      </span>
                    </div>
                  </div>

                  {report.escalated_reason && (
                    <div className="p-3 bg-red-100/70 rounded-xl border border-red-200 text-xs">
                      <span className="text-[10px] font-black uppercase text-red-800 block mb-0.5">Escalation Reason:</span>
                      <p className="text-red-950 font-medium italic">&quot;{report.escalated_reason}&quot;</p>
                    </div>
                  )}
                </div>
              )}

              {/* PHOTOGRAPH & VISUAL CLASSIFICATION */}
              <div className="rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-xs">
                <div className="relative h-60 w-full bg-slate-100">
                  {/* eslint-disable-next-html-element-suppression */}
                  <img
                    src={report.photo_url}
                    alt={report.ticket_code}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-black text-slate-800 shadow-sm">
                    Reported on {new Date(report.created_at).toLocaleDateString()}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-xl text-white text-xs flex items-center justify-between">
                    <span className="font-bold truncate">{report.landmark}</span>
                    <span className="text-[10px] text-blue-300 font-mono">
                      {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Classified Drainage Issue
                      </span>
                      <h4 className="text-base font-black text-slate-900">
                        {report.issue_type.replace(/_/g, ' ')}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-[#256BF5] font-black text-xs border border-blue-100">
                        Confidence: {report.ai_confidence || 94}%
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase ${
                          report.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : report.severity === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {report.severity}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <strong className="text-slate-800 font-bold block mb-0.5">
                      Citizen Description:
                    </strong>
                    {report.description}
                  </p>
                </div>
              </div>

              {/* NIRA PRIORITY SCORE CARD */}
              <NIRAPriorityCard
                priorityData={priorityData}
                showExpandableBreakdown={true}
                defaultExpanded={false}
              />

              {/* LOCATION & GEOSPATIAL BOUNDARY DETAILS */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#EF4444]" /> Geographic & Boundary Routing
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Ward Jurisdiction
                    </span>
                    <strong className="text-slate-900 font-black">
                      {report.ward} (Ward #{report.ward_number})
                    </strong>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Responsible Authority
                    </span>
                    <strong className="text-emerald-800 font-black">
                      {report.authority || 'Keralam Municipal Corporation'}
                    </strong>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Nearby Reports in Ward
                    </span>
                    <strong className="text-slate-900 font-black">
                      {nearbyReportsCount} other active tickets
                    </strong>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Assigned Crew
                    </span>
                    <strong className="text-[#256BF5] font-black">
                      {report.assigned_crew || 'Pending Allocation'}
                    </strong>
                  </div>
                </div>

                {/* Drainage Hotspot Operational Signal */}
                {matchingHotspot ? (
                  <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-200 text-xs text-red-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-black text-[#EF4444]">
                        <Flame className="w-4 h-4 text-[#FFC800] animate-pulse" />
                        <span>DRAINAGE HOTSPOT: {matchingHotspot.id}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black uppercase font-mono">
                        {matchingHotspot.report_count} in 200m
                      </span>
                    </div>

                    <div>
                      <strong className="font-black text-slate-900 block text-xs">
                        {matchingHotspot.location_name}
                      </strong>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                        <span className="text-red-700 font-bold">
                          • {matchingHotspot.unresolved_count ?? matchingHotspot.report_count} unresolved
                        </span>
                        {matchingHotspot.high_priority_count !== undefined && (
                          <span className="text-amber-800 font-bold">
                            • {matchingHotspot.high_priority_count} high priority
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-red-100 space-y-1 text-[11px]">
                      <span className="font-bold text-slate-600 block">Operational Signal:</span>
                      <p className="text-slate-800 font-medium italic">
                        &quot;{matchingHotspot.explanation || 'Repeated reports in a concentrated area may indicate a persistent drainage issue.'}&quot;
                      </p>
                      <div className="pt-1 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Suggested Action:</span>
                        <p className="text-[#256BF5] font-black">
                          {matchingHotspot.suggested_action || 'Inspect drainage segment / dispatch response crew'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-0.5">
                    <span className="font-bold text-slate-700 block">Isolated Incident (Non-Hotspot):</span>
                    <p className="text-[11px] text-slate-500">
                      No recurring drainage hotspot cluster registered within 200m. Standard SLA dispatch protocol applies.
                    </p>
                  </div>
                )}
              </div>

              {/* SLA & ESCALATION DEADLINE */}
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-black">
                  <span className="text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#256BF5]" />
                    SLA Countdown & Escalation Engine
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase ${
                        sla.isBreached
                          ? 'bg-red-100 text-[#EF4444] border border-red-200 animate-pulse'
                          : sla.isApproaching
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : sla.slaState === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-[#256BF5]'
                      }`}
                    >
                      {sla.remainingFormatted}
                    </span>
                  </div>
                </div>

                {/* 4 Diagnostic Indicator Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Target SLA
                    </span>
                    <strong className="font-mono text-slate-900 text-sm">{sla.slaLimitHours} Hours</strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">
                      ({report.severity === 'LOW' ? '24h rule' : report.severity === 'MEDIUM' ? '8h rule' : '4h rule'})
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Elapsed Time
                    </span>
                    <strong className="font-mono text-slate-900 text-sm">
                      {sla.elapsedFormatted}
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">
                      Since Intake
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Current Routing
                    </span>
                    <strong
                      className={`text-xs block truncate ${
                        sla.isBreached || report.status === 'ESCALATED' ? 'text-red-600 font-black' : 'text-slate-900 font-bold'
                      }`}
                      title={currentAuth.title}
                    >
                      L{currentAuth.level}: {currentAuth.title}
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5 truncate">
                      {currentAuth.designation}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Next Escalation
                    </span>
                    <strong
                      className="text-xs block text-[#256BF5] font-black truncate"
                      title={nextAuth.title}
                    >
                      L{nextAuth.level}: {nextAuth.title}
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5 truncate">
                      {nextAuth.designation}
                    </span>
                  </div>
                </div>

                {/* Authority Level Escalation Hierarchy Visualization */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>Configured Prototype Authority Hierarchy:</span>
                    <span className="text-[10px] text-slate-400">Step Routing</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className={`px-2 py-1 rounded-lg border text-xs font-black ${currentAuth.level === 1 ? 'bg-blue-50 border-[#256BF5] text-[#256BF5]' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      Level 1: Ward Response Team
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className={`px-2 py-1 rounded-lg border text-xs font-black ${currentAuth.level === 2 ? 'bg-amber-50 border-amber-400 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      Level 2: Supervisory Officer (AEE)
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className={`px-2 py-1 rounded-lg border text-xs font-black ${currentAuth.level >= 3 ? 'bg-red-50 border-red-400 text-red-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      Level 3: Central Directorate
                    </span>
                  </div>
                </div>

                {/* Escalation History Log if present */}
                {report.escalation_history && report.escalation_history.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-black text-red-900">
                      <History className="w-4 h-4 text-red-600" />
                      <span>Audit Trail: Recorded Escalations ({report.escalation_history.length})</span>
                    </div>
                    <div className="space-y-2">
                      {report.escalation_history.map((record, idx) => (
                        <div key={idx} className="p-2.5 bg-white rounded-xl border border-red-100 text-[11px] space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-red-700 font-mono">
                              Escalated to Level {record.level} ({record.to_authority})
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-700 italic">&quot;{record.reason}&quot;</p>
                          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                            <span>From: {record.from_authority}</span>
                            <span>Target: {record.to_authority}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prototype Disclaimer */}
                <div className="p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-[10px] text-slate-500 font-medium">
                  <strong className="text-slate-700 font-bold block mb-0.5">Notice:</strong>
                  This escalation engine is a prototype municipal demonstration with automated SLA monitoring and hierarchical routing. It is not connected to live KMC municipal emergency dispatch.
                </div>
              </div>

              {/* RESOLUTION EVIDENCE (IF RESOLVED) */}
              {report.status === 'RESOLVED' && (
                <div className="p-5 rounded-3xl bg-emerald-50/90 border-2 border-emerald-300 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-xs text-emerald-900">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Verified Municipal Resolution Evidence Attached</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      Protocol Complete
                    </span>
                  </div>

                  {/* Before vs After Side by Side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-red-600 block">
                        BEFORE: Blocked drain
                      </span>
                      <div className="h-36 rounded-2xl overflow-hidden bg-slate-100 border border-slate-300">
                        {/* eslint-disable-next-html-element-suppression */}
                        <img
                          src={report.photo_url}
                          alt="Before blockage"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-emerald-700 block">
                        AFTER: Cleared drain
                      </span>
                      <div className="h-36 rounded-2xl overflow-hidden bg-emerald-100 border-2 border-emerald-400">
                        {/* eslint-disable-next-html-element-suppression */}
                        <img
                          src={report.resolution_photo_url || report.photo_url}
                          alt="After cleared drain"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI Resolution Comparison result */}
                  <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-emerald-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#256BF5]" />
                        <span>AI-Assisted Resolution Comparison:</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-[#256BF5] font-black text-[10px] border border-blue-100">
                        AI-assisted prototype verification
                      </span>
                    </div>
                    <p className="text-slate-900 font-bold text-xs">
                      &quot;{report.resolution_ai_verification?.comparison_result || 'Obstruction appears reduced/removed.'}&quot;
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      {report.resolution_ai_verification?.disclaimer ||
                        'Visual prototype comparison — Does not definitively prove complete sub-surface hydraulic flow.'}
                    </p>
                  </div>

                  <p className="text-xs text-slate-700 font-medium">
                    <strong className="text-slate-900 font-bold">Clearance Notes: </strong>
                    {report.resolution_notes || 'Drain cleared, desilted, and water flow unblocked.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OPERATIONS & DISPATCH ACTIONS */}
          {activeTab === 'actions' && (
            <div className="space-y-6 animate-fadeIn">
              {/* ACTION 1: ASSIGN CREW */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#256BF5]" /> 1. Assign Municipal Action Crew
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Current: {report.assigned_crew || 'None'}
                  </span>
                </div>

                <div className="space-y-2">
                  {availableCrews.map((crew, idx) => (
                    <label
                      key={idx}
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

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleAssignCrew}
                  className="w-full py-2.5 rounded-xl bg-[#256BF5] hover:bg-blue-700 text-white font-black text-xs shadow-sm transition-colors"
                >
                  {isUpdating ? 'Updating...' : 'Confirm Crew Assignment (Status: ASSIGNED)'}
                </button>
              </div>

              {/* ACTION 2: START WORK */}
              {report.status !== 'IN_PROGRESS' && report.status !== 'RESOLVED' && (
                <div className="p-5 rounded-3xl bg-blue-50/60 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-[#256BF5] flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> 2. Mark Crew On-Site
                    </h4>
                    <span className="text-[10px] font-mono text-blue-600 font-bold">
                      Transition to IN_PROGRESS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Changes status to <strong>IN_PROGRESS</strong> to signal that the
                    dispatched squad has arrived on site with suction pumps or desilting tools.
                  </p>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={handleStartWork}
                    className="w-full py-2.5 rounded-xl bg-[#256BF5] hover:bg-blue-700 text-white font-black text-xs shadow-sm transition-colors"
                  >
                    Start Work (IN_PROGRESS)
                  </button>
                </div>
              )}

              {/* ACTION 3: CHANGE PRIORITY / SEVERITY */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-600" /> 3. Adjust Priority & Severity
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as SeverityLevel[]).map(sev => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setOverrideSeverity(sev)}
                      className={`py-2 rounded-xl text-xs font-black border transition-all ${
                        overrideSeverity === sev
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleChangePriority}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-colors"
                >
                  Recalculate & Persist Priority Score
                </button>
              </div>

              {/* ACTION 4: RESOLUTION EVIDENCE UPLOAD & VERIFICATION */}
              {report.status !== 'RESOLVED' && (
                <div className="p-5 rounded-3xl bg-emerald-50/80 border-2 border-emerald-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 4. Closed-Loop Resolution Evidence Gate
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      Mandatory
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Municipal protocol requires visual after-photo proof and automated AI-assisted comparison analysis before resolution confirmation.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowResolutionModal(true)}
                    className="w-full py-3 rounded-xl bg-[#10B981] hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 hover:scale-101"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Open Resolution Evidence & Verification Interface</span>
                  </button>
                </div>
              )}

              {/* ACTION 5: ESCALATE TICKET & ROUTING */}
              {report.status !== 'RESOLVED' && (
                <div className="p-5 rounded-3xl bg-red-50/80 border-2 border-red-300 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-red-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" /> 5. Municipal Authority Escalation Routing
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black uppercase font-mono">
                      Current: Level {currentAuth.level}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-red-200 text-xs space-y-1.5 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Next Authority Escalation Target:</span>
                    <div className="flex items-center gap-2 font-black text-slate-900">
                      <span className="text-slate-700">Level {currentAuth.level} ({currentAuth.title})</span>
                      <ArrowRight className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="text-red-700">Level {nextAuth.level} ({nextAuth.title})</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Forwarding to: {nextAuth.designation}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Escalation Reason & Operational Dispatch Note:
                    </label>
                    <textarea
                      rows={2}
                      value={escalationReason}
                      onChange={e => setEscalationReason(e.target.value)}
                      placeholder="Provide reason for administrative escalation..."
                      className="w-full p-2.5 rounded-xl bg-white border border-red-200 text-slate-800 text-xs focus:outline-hidden focus:border-red-500 transition-colors"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={handleConfirmEscalate}
                      className="w-full py-2.5 rounded-xl bg-[#EF4444] hover:bg-red-700 text-white font-black text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{isUpdating ? 'Escalating...' : `Escalate to Level ${nextAuth.level}`}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => {
                        const breachReason = `SLA Breached: Overdue by simulated authority trigger on ${report.ticket_code}. Requires immediate supervisory dispatch.`;
                        setEscalationReason(breachReason);
                        const nowIso = new Date(simulatedTime).toISOString();
                        const escalated = escalateReportOnBreach(report, {
                          customReason: breachReason,
                          simulatedCurrentTimeMs: simulatedTime,
                        });
                        niraService.updateReportStatus(report.id, 'ESCALATED', {
                          escalatedReason: breachReason,
                          escalationLevel: escalated.escalation_level,
                          escalatedAt: escalated.escalated_at,
                          slaState: 'SLA_BREACHED',
                          escalationHistory: escalated.escalation_history,
                        });
                        onReportUpdated(escalated);
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Timer className="w-3.5 h-3.5 text-[#FFC800]" />
                      <span>Trigger SLA Breach (Demo)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INTERNAL NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4 animate-fadeIn">
              <form onSubmit={handleAddInternalNote} className="space-y-2">
                <label className="block text-xs font-black text-slate-800">
                  Add Municipal Internal Note
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInternalNote}
                    onChange={e => setNewInternalNote(e.target.value)}
                    placeholder="e.g. Suction pump 03 en route via SA Road..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#256BF5]"
                  />
                  <button
                    type="submit"
                    disabled={isUpdating || !newInternalNote.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#256BF5] hover:bg-blue-700 text-white font-black text-xs shadow-xs transition-colors"
                  >
                    Add
                  </button>
                </div>
              </form>

              <div className="space-y-2 pt-2">
                {report.internal_notes && report.internal_notes.length > 0 ? (
                  report.internal_notes.map((note, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 leading-relaxed"
                    >
                      {note}
                    </div>
                  ))
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium">
                    No internal notes recorded on this ticket yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RESOLUTION EVIDENCE MODAL */}
      {showResolutionModal && (
        <ResolutionEvidenceModal
          report={report}
          onClose={() => setShowResolutionModal(false)}
          onResolved={updated => {
            onReportUpdated(updated);
            setShowResolutionModal(false);
          }}
        />
      )}
    </div>
  );
};
