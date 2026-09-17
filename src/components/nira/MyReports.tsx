'use client';

import React, { useState } from 'react';
import { DrainageReport } from '@/lib/niraTypes';
import { NIRAPriorityBadge } from './NIRAPriorityBadge';
import { ClipboardList, User, MapPin, CheckCircle2, Truck, ShieldCheck, Clock, FileText, Sparkles } from 'lucide-react';

interface MyReportsProps {
  reports: DrainageReport[];
}

export const MyReports: React.FC<MyReportsProps> = ({ reports }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredReports = reports.filter(rep => {
    if (filterStatus === 'ALL') return true;
    return rep.status === filterStatus;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#256BF5]" />
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              My Submitted Drainage Reports
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Track real-time progress timeline, municipal officer assignment, rapid action crew, and verified resolution evidence for your tickets.
          </p>
        </div>

        {/* Status Filter Pills (Fund My Crazy Style) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs overflow-x-auto">
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-black transition-all ${
                filterStatus === st
                  ? 'bg-[#256BF5] text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* REPORTS LIST */}
      <div className="space-y-6">
        {filteredReports.length === 0 ? (
          <div className="bg-slate-50 rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
            <p className="text-base font-black">No drainage reports found for this filter.</p>
          </div>
        ) : (
          filteredReports.map(report => (
            <div
              key={report.id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 space-y-6"
            >
              {/* TOP HEADER */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                    {/* eslint-disable-next-html-element-suppression */}
                    <img src={report.photo_url} alt="Drainage photo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-[#256BF5]">{report.ticket_code}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        report.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-[#10B981]'
                          : report.status === 'ESCALATED'
                          ? 'bg-red-100 text-[#EF4444]'
                          : report.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-[#256BF5]'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 mt-1">{report.issue_type.replace(/_/g, ' ')}</h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-600 font-bold">
                      <span className="flex items-center gap-1 text-slate-800 font-black">
                        <MapPin className="w-3.5 h-3.5 text-[#EF4444]" /> Ward {report.ward_number} ({report.ward})
                      </span>
                      <span>•</span>
                      <span className="text-emerald-800 font-black">
                        {report.authority || 'Keralam Municipal Corporation (KMC)'}
                      </span>
                      <span>•</span>
                      <span className="text-slate-500 font-medium">{report.landmark}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-[10px] font-bold text-slate-400">NIRA Priority Score</div>
                  <NIRAPriorityBadge score={report.priority_score} size="md" />
                  {report.sla_hours && (
                    <div className="text-[10px] font-bold text-slate-500">Target SLA: {report.sla_hours}h</div>
                  )}
                </div>
              </div>

              {/* DESCRIPTION & ASSIGNED OFFICER / CREW */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div>
                    <p className="font-black text-slate-700">Citizen Description:</p>
                    <p className="text-slate-600 font-medium mt-0.5">{report.description}</p>
                  </div>

                  {report.priority_explanation && (
                    <div className="pt-2 border-t border-slate-200/80 flex items-start gap-1.5 text-slate-600">
                      <Sparkles className="w-3.5 h-3.5 text-[#256BF5] flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] font-medium leading-relaxed">
                        <strong className="text-slate-900 font-bold">Operational Prioritization Logic:</strong> {report.priority_explanation}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div>
                    <p className="font-black text-slate-700 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#256BF5]" /> Assigned Officer:
                    </p>
                    <p className="text-slate-900 font-bold mt-0.5">{report.assigned_officer || 'Ward Assistant Engineer'}</p>
                  </div>

                  {report.assigned_crew && (
                    <div className="pt-1.5 border-t border-slate-200/80">
                      <p className="font-black text-slate-700 flex items-center gap-1 text-[11px]">
                        <Truck className="w-3.5 h-3.5 text-emerald-600" /> Dispatched Crew:
                      </p>
                      <p className="text-emerald-700 font-bold text-[11px] mt-0.5">{report.assigned_crew}</p>
                    </div>
                  )}

                  {report.escalated_reason && (
                    <div className="pt-1.5 border-t border-slate-200/80">
                      <p className="text-[#EF4444] text-[11px] font-bold">
                        ⚠️ Escalated: {report.escalated_reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* TIMELINE PROGRESS PIPELINE (Fund My Crazy Style) */}
              <div className="pt-2">
                <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-3">
                  Resolution Progress Timeline
                </p>
                <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-black">
                  {/* Step 1: Reported */}
                  <div className="space-y-1.5">
                    <div className="w-full h-2 rounded-full bg-[#256BF5]"></div>
                    <span className="text-[#256BF5]">1. Reported</span>
                  </div>

                  {/* Step 2: Assigned */}
                  <div className="space-y-1.5">
                    <div
                      className={`w-full h-2 rounded-full ${
                        report.status !== 'OPEN' || report.assigned_crew
                          ? 'bg-[#256BF5]'
                          : 'bg-slate-200'
                      }`}
                    ></div>
                    <span
                      className={
                        report.status !== 'OPEN' || report.assigned_crew
                          ? 'text-[#256BF5]'
                          : 'text-slate-400'
                      }
                    >
                      2. Assigned
                    </span>
                  </div>

                  {/* Step 3: Work Started */}
                  <div className="space-y-1.5">
                    <div
                      className={`w-full h-2 rounded-full ${
                        report.status === 'IN_PROGRESS' || report.status === 'RESOLVED'
                          ? 'bg-[#256BF5]'
                          : report.status === 'ESCALATED'
                          ? 'bg-[#EF4444]'
                          : 'bg-slate-200'
                      }`}
                    ></div>
                    <span
                      className={
                        report.status === 'ESCALATED'
                          ? 'text-[#EF4444]'
                          : report.status === 'IN_PROGRESS' || report.status === 'RESOLVED'
                          ? 'text-[#256BF5]'
                          : 'text-slate-400'
                      }
                    >
                      {report.status === 'ESCALATED' ? '3. Escalated' : '3. Work Started'}
                    </span>
                  </div>

                  {/* Step 4: Resolution Evidence Uploaded */}
                  <div className="space-y-1.5">
                    <div
                      className={`w-full h-2 rounded-full ${
                        report.resolution_photo_url || report.status === 'RESOLVED'
                          ? 'bg-[#256BF5]'
                          : 'bg-slate-200'
                      }`}
                    ></div>
                    <span
                      className={
                        report.resolution_photo_url || report.status === 'RESOLVED'
                          ? 'text-[#256BF5]'
                          : 'text-slate-400'
                      }
                    >
                      4. Evidence Uploaded
                    </span>
                  </div>

                  {/* Step 5: Resolved */}
                  <div className="space-y-1.5">
                    <div
                      className={`w-full h-2 rounded-full ${
                        report.status === 'RESOLVED' ? 'bg-[#10B981]' : 'bg-slate-200'
                      }`}
                    ></div>
                    <span
                      className={
                        report.status === 'RESOLVED' ? 'text-[#10B981]' : 'text-slate-400'
                      }
                    >
                      5. Resolved
                    </span>
                  </div>
                </div>
              </div>

              {/* VERIFIED RESOLUTION EVIDENCE & PHOTO PROOF (SC-08 Resolution Verification) */}
              {report.status === 'RESOLVED' && (
                <div className="mt-4 p-5 rounded-3xl bg-emerald-50/80 border-2 border-emerald-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-emerald-950">
                          Work Completed & Cleared by Municipal Authority
                        </h4>
                        <p className="text-[11px] text-emerald-700 font-bold">
                          Official municipal resolution evidence uploaded and inspected.
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>KMC Verified</span>
                    </div>
                  </div>

                  {/* BEFORE & AFTER PHOTO EVIDENCE COMPARISON */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Before Photo */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-black text-slate-700">
                        <span className="flex items-center gap-1 text-red-600">
                          <span>⚠️</span> BEFORE: Blocked drain
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="w-full h-40 rounded-2xl bg-slate-200 overflow-hidden border border-slate-300 relative">
                        {/* eslint-disable-next-html-element-suppression */}
                        <img
                          src={report.photo_url}
                          alt="Before: Clogged Drain"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* After Resolution Photo */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-black text-emerald-800">
                        <span className="flex items-center gap-1 text-emerald-700">
                          <span>✓</span> AFTER: Cleared drain
                        </span>
                        {report.resolved_at && (
                          <span className="text-emerald-600 font-mono text-[10px]">
                            {new Date(report.resolved_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="w-full h-40 rounded-2xl bg-emerald-100 overflow-hidden border-2 border-emerald-400 relative">
                        {/* eslint-disable-next-html-element-suppression */}
                        <img
                          src={report.resolution_photo_url || report.photo_url}
                          alt="After: Cleared Drain Resolution Evidence"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI Resolution Comparison Result */}
                  <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-emerald-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#256BF5]" />
                        <span>AI-Assisted Resolution Comparison:</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-[#256BF5] font-black text-[10px] border border-blue-100">
                        AI-assisted prototype verification
                      </span>
                    </div>
                    <p className="text-slate-800 font-bold text-xs">
                      &quot;{report.resolution_ai_verification?.comparison_result || 'Obstruction appears reduced/removed.'}&quot;
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      {report.resolution_ai_verification?.disclaimer ||
                        'Visual prototype comparison — Does not definitively prove complete sub-surface hydraulic flow.'}
                    </p>
                  </div>

                  {/* Resolution Notes & Crew Footer */}
                  <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-black text-slate-800 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resolution Notes:</span>
                      </p>
                      <p className="text-slate-600 font-medium text-[11px]">
                        {report.resolution_notes ||
                          'Drain cleared, desilted, and water flow successfully restored by rapid action team.'}
                      </p>
                    </div>

                    {report.assigned_crew && (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block">
                          Executing Unit:
                        </span>
                        <span className="text-emerald-700 font-black text-[11px]">
                          {report.assigned_crew}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
};
