'use client';

import React, { useState } from 'react';

import { DrainageReport, HotspotCluster, ReportStatus } from '@/lib/niraTypes';

import { niraService } from '@/lib/niraService';
import { useAuth } from '@/lib/authContext';
import { ShieldAlert, AlertTriangle, CheckCircle, Flame, Filter, MapPin, Building2, Lock, ArrowRight } from 'lucide-react';

interface AuthorityCommandCenterProps {
  reports: DrainageReport[];
  hotspots: HotspotCluster[];
  onReportUpdated: (updatedReport: DrainageReport) => void;
  onOpenAuthModal?: () => void;
}

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

  const isAuthority = user?.role === 'GOVERNMENT';


  const totalTickets = reports.length;
  const criticalCount = reports.filter(r => r.priority_score >= 75 || r.status === 'ESCALATED').length;
  const resolvedCount = reports.filter(r => r.status === 'RESOLVED').length;
  const escalatedCount = reports.filter(r => r.status === 'ESCALATED').length;

  const filteredReports = reports
    .filter(r => selectedWard === 'ALL' || r.ward.includes(selectedWard))
    .sort((a, b) => (sortByPriority ? b.priority_score - a.priority_score : 0));

  const handleStatusUpdate = async (report: DrainageReport, newStatus: ReportStatus) => {
    setUpdatingId(report.id);
    try {
      const reason = newStatus === 'ESCALATED' ? 'Unattended by ward crew within 3 hours during active rainfall.' : undefined;
      await niraService.updateReportStatus(report.id, newStatus, reason);

      const updatedObj: DrainageReport = {
        ...report,
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(reason ? { escalated_reason: reason } : {}),
      };

      onReportUpdated(updatedObj);
    } catch (e) {
      console.error('Failed to update status:', e);
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
            Drainage Operations, Ward Dispatch Roster & AI Hotspot Cluster Detection
          </p>
        </div>

        {/* Authority Login Quick Access */}
        {!isAuthority ? (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl text-xs">
            <span className="font-bold text-amber-900">Officer Login: <strong className="font-mono">admin@nira.in</strong></span>
            <button
              onClick={() => signInAuthority('admin@nira.in', 'nira@123')}
              className="px-3 py-1 rounded-xl bg-[#FFC800] hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm transition-all"
            >
              1-Tap Authority Login
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl text-xs font-bold text-emerald-800">
            <CheckCircle className="w-4 h-4 text-[#10B981]" />
            <span>Logged in as Government Authority ({user?.email})</span>
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

      {/* METRIC KPI CARDS (Fund My Crazy Style: Solid Yellow, Blue, Green, Red) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Yellow Card: Total Tickets */}
        <div className="bg-[#FFC800] p-6 rounded-3xl relative shadow-md">
          <div className="text-xs font-black text-slate-900 uppercase">Total Tickets</div>
          <p className="text-4xl font-black text-slate-900 mt-2 font-mono">{totalTickets}</p>
          <div className="mt-3 inline-block bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-xl">
            5 Wards Active
          </div>
        </div>

        {/* Blue Card: High Priority Drains */}
        <div className="bg-[#256BF5] p-6 rounded-3xl text-white relative shadow-md">
          <div className="text-xs font-black text-blue-100 uppercase">High Priority (Score ≥ 75)</div>
          <p className="text-4xl font-black text-white mt-2 font-mono">{criticalCount}</p>
          <div className="mt-3 inline-block bg-[#FFC800] text-slate-950 text-[10px] font-black px-3 py-1 rounded-xl">
            Immediate Desilt
          </div>
        </div>

        {/* Red Card: Escalated Tickets */}
        <div className="bg-[#EF4444] p-6 rounded-3xl text-white relative shadow-md">
          <div className="text-xs font-black text-red-100 uppercase">Escalated Tickets</div>
          <p className="text-4xl font-black text-white mt-2 font-mono">{escalatedCount}</p>
          <div className="mt-3 inline-block bg-white text-[#EF4444] text-[10px] font-black px-3 py-1 rounded-xl shadow-sm">
            AE Alert Sent
          </div>
        </div>

        {/* Green Card: Cleared & Resolved */}
        <div className="bg-[#10B981] p-6 rounded-3xl text-white relative shadow-md">
          <div className="text-xs font-black text-emerald-100 uppercase">Cleared & Resolved</div>
          <p className="text-4xl font-black text-white mt-2 font-mono">{resolvedCount}</p>
          <div className="mt-3 inline-block bg-white text-[#10B981] text-[10px] font-black px-3 py-1 rounded-xl shadow-sm">
            {Math.round((resolvedCount / Math.max(1, totalTickets)) * 100)}% Resolved
          </div>
        </div>

      </div>

      {/* HOTSPOT CLUSTER DETECTION ALERT BANNER (Fund My Crazy Style) */}
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
                <th className="px-4 py-3">PNR Code / Issue</th>
                <th className="px-4 py-3">Ward & Landmark</th>
                <th className="px-4 py-3">Priority Score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned Officer</th>
                <th className="px-4 py-3 text-right">Dispatch Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredReports.map(rep => (
                <tr key={rep.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-mono font-black text-[#256BF5]">{rep.ticket_code}</div>
                    <div className="text-[11px] text-slate-600">{rep.issue_type.replace(/_/g, ' ')}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-black text-slate-900">{rep.ward}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{rep.landmark}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono font-black text-sm ${
                      rep.priority_score >= 80 ? 'text-[#EF4444]' : rep.priority_score >= 60 ? 'text-amber-600' : 'text-[#256BF5]'
                    }`}>
                      {rep.priority_score}/100
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
                  <td className="px-4 py-3 text-slate-600 font-bold">
                    {rep.assigned_officer || 'AE Drainage (Default)'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {rep.status !== 'IN_PROGRESS' && rep.status !== 'RESOLVED' && (
                        <button
                          disabled={updatingId === rep.id}
                          onClick={() => handleStatusUpdate(rep, 'IN_PROGRESS')}
                          className="px-3 py-1.5 rounded-xl bg-[#256BF5] text-white font-black text-[10px] shadow-sm hover:bg-blue-700 transition-colors"
                        >
                          Assign Crew
                        </button>
                      )}
                      {rep.status !== 'RESOLVED' && (
                        <button
                          disabled={updatingId === rep.id}
                          onClick={() => handleStatusUpdate(rep, 'RESOLVED')}
                          className="px-3 py-1.5 rounded-xl bg-[#10B981] text-white font-black text-[10px] shadow-sm hover:bg-green-700 transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                      {rep.status !== 'ESCALATED' && rep.status !== 'RESOLVED' && (
                        <button
                          disabled={updatingId === rep.id}
                          onClick={() => handleStatusUpdate(rep, 'ESCALATED')}
                          className="px-3 py-1.5 rounded-xl bg-[#EF4444] text-white font-black text-[10px] shadow-sm hover:bg-red-700 transition-colors"
                        >
                          Escalate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
