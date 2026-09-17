'use client';

import React, { useState, useRef } from 'react';
import { DrainageReport, HotspotCluster, ReportStatus } from '@/lib/niraTypes';
import { niraService } from '@/lib/niraService';
import { NIRAPriorityBadge } from './NIRAPriorityBadge';
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
  Camera,
  FileCheck
} from 'lucide-react';

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

export const AuthorityCommandCenter: React.FC<AuthorityCommandCenterProps> = ({
  reports,
  hotspots,
  onReportUpdated,
  onOpenAuthModal,
}) => {
  const { user, signInAuthority } = useAuth();
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [sortByPriority, setSortByPriority] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modals state
  const [crewModalReport, setCrewModalReport] = useState<DrainageReport | null>(null);
  const [selectedCrew, setSelectedCrew] = useState<string>(AVAILABLE_CREWS[0]);

  const [resolutionModalReport, setResolutionModalReport] = useState<DrainageReport | null>(null);
  const [resolutionPhotoUrl, setResolutionPhotoUrl] = useState<string>(SAMPLE_RESOLUTION_PHOTOS[0].url);
  const [resolutionNotes, setResolutionNotes] = useState<string>('Drain cleared using high-pressure jetting and suction pump. Water flow fully restored.');
  const [isUploadingResolution, setIsUploadingResolution] = useState<boolean>(false);
  const resolutionFileInputRef = useRef<HTMLInputElement>(null);

  const [escalationModalReport, setEscalationModalReport] = useState<DrainageReport | null>(null);
  const [escalationReason, setEscalationReason] = useState<string>('SLA Breached: Stalled over allowable time during active monsoon downpour. Requires Assistant Executive Engineer intervention.');

  const isAuthority = user?.role === 'GOVERNMENT';

  const totalTickets = reports.length;
  const criticalCount = reports.filter(r => r.priority_score >= 75 || r.status === 'ESCALATED').length;
  const resolvedCount = reports.filter(r => r.status === 'RESOLVED').length;
  const escalatedCount = reports.filter(r => r.status === 'ESCALATED').length;

  const filteredReports = reports
    .filter(r => selectedWard === 'ALL' || r.ward.includes(selectedWard))
    .sort((a, b) => (sortByPriority ? b.priority_score - a.priority_score : 0));

  // SLA Calculation Helper
  const getSlaInfo = (report: DrainageReport) => {
    const elapsedHours = Math.max(0, (Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60));
    const limit = report.sla_hours || (report.severity === 'CRITICAL' ? 3 : report.severity === 'HIGH' ? 6 : 12);
    const remaining = limit - elapsedHours;
    const isBreached = remaining < 0 && report.status !== 'RESOLVED';

    return {
      limit,
      elapsedHours: Math.round(elapsedHours * 10) / 10,
      isBreached,
      remainingDisplay: isBreached
        ? `Breached (+${Math.round(Math.abs(remaining))}h)`
        : `${Math.round(remaining)}h left`,
    };
  };

  // Crew Assignment Action
  const handleConfirmAssignCrew = async () => {
    if (!crewModalReport) return;
    setUpdatingId(crewModalReport.id);
    try {
      await niraService.updateReportStatus(crewModalReport.id, 'IN_PROGRESS', {
        assignedCrew: selectedCrew,
      });

      const updatedObj: DrainageReport = {
        ...crewModalReport,
        status: 'IN_PROGRESS',
        assigned_officer: selectedCrew,
        assigned_crew: selectedCrew,
        updated_at: new Date().toISOString(),
      };

      onReportUpdated(updatedObj);
      setCrewModalReport(null);
    } catch (e) {
      console.error('Failed to assign crew:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Resolution Evidence Upload Handler
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

  // Confirm Resolution with Evidence
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
      setResolutionModalReport(null);
    } catch (e) {
      console.error('Failed to resolve report:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Confirm Escalation Action
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
      setEscalationModalReport(null);
    } catch (e) {
      console.error('Failed to escalate report:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#256BF5]" />
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Kochi Municipal Command Center
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Drainage Operations, SLA Monitoring, Rapid Crew Dispatch & Resolution Verification
          </p>
        </div>

        {/* Authority Login Quick Access */}
        {!isAuthority ? (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl text-xs">
            <span className="font-bold text-amber-900">Government Portal: <strong className="font-mono">admin@nira.in</strong></span>
            <button
              onClick={() => onOpenAuthModal ? onOpenAuthModal() : signInAuthority('admin@nira.in', 'nira@123')}
              className="px-3.5 py-1.5 rounded-xl bg-[#FFC800] hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm transition-all flex items-center gap-1.5"
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

        <div className="flex items-center gap-3">
          <select
            value={selectedWard}
            onChange={e => setSelectedWard(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-black text-slate-900 focus:outline-none focus:border-[#256BF5]"
          >
            <option value="ALL">All Kochi Wards</option>
            <option value="Vyttila">Ward 24 (Vyttila)</option>
            <option value="Kadavanthra">Ward 35 (Kadavanthra)</option>
            <option value="Fort Kochi">Ward 12 (Fort Kochi)</option>
            <option value="Edappally">Ward 40 (Edappally)</option>
            <option value="Kaloor">Ward 28 (Kaloor)</option>
          </select>

          <button
            onClick={() => setSortByPriority(!sortByPriority)}
            className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${
              sortByPriority
                ? 'bg-[#256BF5] text-white border-[#256BF5]'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            Priority Sort: {sortByPriority ? 'High ➔ Low' : 'Default'}
          </button>
        </div>
      </div>

      {/* METRIC KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#FFC800] p-6 rounded-3xl relative shadow-md">
          <div className="text-xs font-black text-slate-900 uppercase">Total Tickets</div>
          <p className="text-4xl font-black text-slate-900 mt-2 font-mono">{totalTickets}</p>
          <div className="mt-3 inline-block bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-xl">
            5 Wards Active
          </div>
        </div>

        <div className="bg-[#256BF5] p-6 rounded-3xl text-white relative shadow-md">
          <div className="text-xs font-black text-blue-100 uppercase">High Priority (Score ≥ 75)</div>
          <p className="text-4xl font-black text-white mt-2 font-mono">{criticalCount}</p>
          <div className="mt-3 inline-block bg-[#FFC800] text-slate-950 text-[10px] font-black px-3 py-1 rounded-xl">
            Immediate Desilt Required
          </div>
        </div>

        <div className="bg-[#EF4444] p-6 rounded-3xl text-white relative shadow-md">
          <div className="text-xs font-black text-red-100 uppercase">Escalated Tickets</div>
          <p className="text-4xl font-black text-white mt-2 font-mono">{escalatedCount}</p>
          <div className="mt-3 inline-block bg-white text-[#EF4444] text-[10px] font-black px-3 py-1 rounded-xl shadow-sm">
            AE Alert Sent
          </div>
        </div>

        <div className="bg-[#10B981] p-6 rounded-3xl text-white relative shadow-md">
          <div className="text-xs font-black text-emerald-100 uppercase">Cleared & Resolved</div>
          <p className="text-4xl font-black text-white mt-2 font-mono">{resolvedCount}</p>
          <div className="mt-3 inline-block bg-white text-[#10B981] text-[10px] font-black px-3 py-1 rounded-xl shadow-sm">
            {Math.round((resolvedCount / Math.max(1, totalTickets)) * 100)}% Resolved with Evidence
          </div>
        </div>
      </div>

      {/* HOTSPOT CLUSTER DETECTION ALERT BANNER */}
      <div className="bg-[#EDF4FF] rounded-3xl p-6 sm:p-8 border-2 border-blue-200 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#EF4444] animate-pulse" />
          <h3 className="text-base font-black text-slate-900">
            AI Hotspot Cluster Detection: Repeated Drainage Failure Zones
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hotspots.map(hs => (
            <div key={hs.id} className="p-4 rounded-2xl bg-white border border-blue-100 space-y-2 text-xs shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-900">{hs.location_name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-[#EF4444]">
                  {hs.risk_level}
                </span>
              </div>
              <p className="text-slate-500 font-bold">
                {hs.report_count} Reports clustered in 300m radius
              </p>
              <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-100">
                <span>{hs.ward}</span>
                <span>Last report: {hs.last_reported}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OPERATIONS TICKETS TABLE */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#256BF5]" /> Municipal Ward Ticket Dispatch Queue
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Ticket / Issue</th>
                <th className="px-4 py-3">Ward & Landmark</th>
                <th className="px-4 py-3">NIRA Priority Score</th>
                <th className="px-4 py-3">SLA Status</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned Crew</th>
                <th className="px-4 py-3 text-right">Dispatch Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredReports.map(rep => {
                const sla = getSlaInfo(rep);
                return (
                  <tr key={rep.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-black text-[#256BF5]">{rep.ticket_code}</div>
                      <div className="text-[11px] text-slate-600 font-bold">{rep.issue_type.replace(/_/g, ' ')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-black text-slate-900">{rep.ward} (Ward #{rep.ward_number})</div>
                      <div className="text-[10px] font-black text-emerald-800">{rep.authority || 'Kochi Municipal Corporation (KMC)'}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{rep.landmark}</div>
                    </td>
                    <td className="px-4 py-3">
                      <NIRAPriorityBadge score={rep.priority_score} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        rep.status === 'RESOLVED'
                          ? 'bg-slate-100 text-slate-600'
                          : sla.isBreached
                          ? 'bg-red-100 text-[#EF4444]'
                          : 'bg-blue-50 text-[#256BF5]'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>{rep.status === 'RESOLVED' ? `Done in ${sla.elapsedHours}h` : sla.remainingDisplay}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        rep.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-[#10B981]'
                          : rep.status === 'ESCALATED'
                          ? 'bg-red-100 text-[#EF4444]'
                          : rep.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-[#256BF5]'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rep.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-bold">
                      <div className="truncate max-w-[180px]">{rep.assigned_crew || rep.assigned_officer || 'Unassigned'}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rep.status !== 'IN_PROGRESS' && rep.status !== 'RESOLVED' && (
                          <button
                            disabled={updatingId === rep.id}
                            onClick={() => setCrewModalReport(rep)}
                            className="px-3 py-1.5 rounded-xl bg-[#256BF5] text-white font-black text-[10px] shadow-sm hover:bg-blue-700 transition-colors"
                          >
                            Assign Crew
                          </button>
                        )}
                        {rep.status !== 'RESOLVED' && (
                          <button
                            disabled={updatingId === rep.id}
                            onClick={() => setResolutionModalReport(rep)}
                            className="px-3 py-1.5 rounded-xl bg-[#10B981] text-white font-black text-[10px] shadow-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Resolve</span>
                          </button>
                        )}
                        {rep.status !== 'ESCALATED' && rep.status !== 'RESOLVED' && (
                          <button
                            disabled={updatingId === rep.id}
                            onClick={() => setEscalationModalReport(rep)}
                            className="px-3 py-1.5 rounded-xl bg-[#EF4444] text-white font-black text-[10px] shadow-sm hover:bg-red-700 transition-colors"
                          >
                            Escalate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: CREW ASSIGNMENT MODAL */}
      {/* ========================================================= */}
      {crewModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-blue-100 shadow-2xl space-y-5">
            <button
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
                <p className="text-xs text-slate-500 font-bold">{crewModalReport.ticket_code} • {crewModalReport.ward} (Ward #{crewModalReport.ward_number}) • {crewModalReport.authority || 'KMC'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-700 block">NIRA Priority Score</span>
                <span className="text-[10px] text-slate-400 font-bold">Prototype operational prioritization</span>
              </div>
              <NIRAPriorityBadge score={crewModalReport.priority_score} size="sm" />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-700">Select Available Municipal Crew</label>
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
                onClick={handleConfirmAssignCrew}
                className="px-5 py-2.5 rounded-xl bg-[#256BF5] hover:bg-blue-600 text-white text-xs font-black shadow-md shadow-blue-500/25"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: RESOLUTION EVIDENCE UPLOAD MODAL */}
      {/* ========================================================= */}
      {resolutionModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-2xl space-y-5">
            <button
              onClick={() => setResolutionModalReport(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#10B981] text-white flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Upload Resolution Evidence</h3>
                <p className="text-xs text-slate-500 font-bold">
                  {resolutionModalReport.ticket_code} • {resolutionModalReport.ward} (Ward #{resolutionModalReport.ward_number}) • {resolutionModalReport.authority || 'KMC'}
                </p>
              </div>
            </div>

            {/* Before vs After Photo Proof */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-500 mb-1">1. Reported Problem Photo</label>
                <div className="w-full h-28 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                  <img src={resolutionModalReport.photo_url} alt="Before" className="w-full h-full object-cover" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#10B981] mb-1">2. Resolution Evidence Photo</label>
                <div className="w-full h-28 rounded-2xl bg-slate-100 overflow-hidden border-2 border-emerald-500 relative">
                  <img src={resolutionPhotoUrl} alt="After" className="w-full h-full object-cover" />
                  {isUploadingResolution && (
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white text-xs font-black">
                      Uploading to Supabase...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Upload Button & Samples */}
            <div className="space-y-2">
              <input
                ref={resolutionFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleResolutionFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => resolutionFileInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 border-2 border-dashed border-emerald-300 text-[#10B981] font-black text-xs flex items-center justify-center gap-2 hover:bg-emerald-100/60"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Cleared Drain Work Photo</span>
              </button>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400 font-bold">Or select standard evidence:</span>
                {SAMPLE_RESOLUTION_PHOTOS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setResolutionPhotoUrl(sample.url)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    Sample {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Notes */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Official Resolution Notes</label>
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#10B981]"
                placeholder="Details of desilting, repair or trash extraction performed..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResolutionModalReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                className="px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-black shadow-md shadow-green-500/25 flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Verify & Mark Resolved</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ESCALATION MODAL */}
      {/* ========================================================= */}
      {escalationModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-red-100 shadow-2xl space-y-4">
            <button
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
                <p className="text-xs text-slate-500 font-mono font-bold">{escalationModalReport.ticket_code}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Escalation Justification</label>
              <textarea
                rows={3}
                value={escalationReason}
                onChange={e => setEscalationReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#EF4444]"
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
